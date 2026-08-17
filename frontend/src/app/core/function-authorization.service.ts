import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

type ModuleAuthorizationCode = 'allow' | 'deny';
type FunctionAuthorizationCode = 'allow' | 'deny';

interface AuthorizationModuleDto {
  moduleCode: string;
  moduleAuthorization: ModuleAuthorizationCode;
  functions?: AuthorizationFunctionDto[];
}

interface AuthorizationRoleMatrixDto {
  roleId: string;
  modules: AuthorizationModuleDto[];
}

interface AuthorizationFunctionDto {
  functionCode: string;
  authorization: FunctionAuthorizationCode;
}

/**
 * Carica le autorizzazioni funzione del ruolo selezionato con fallback allo scope modulo.
 */
@Injectable({ providedIn: 'root' })
export class FunctionAuthorizationService {
  private loadedRoleId = '';
  private loadingPromise: Promise<void> | null = null;
  private moduleScopes = new Map<string, ModuleAuthorizationCode>();
  private functionScopes = new Map<string, FunctionAuthorizationCode>();

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {
    this.authService.getSelectedRoleChanges().subscribe(() => {
      this.resetCache();
    });
  }

  async canUseFunction(moduleCode: string, functionCode: string): Promise<boolean> {
    const scope = await this.getFunctionScope(moduleCode, functionCode);
    console.info('[FunctionAuthorizationService] canUseFunction()', {
      selectedRole: this.authService.getSelectedRole(),
      moduleCode,
      functionCode,
      scope,
      allowed: scope === 'allow'
    });
    return scope === 'allow';
  }

  async getFunctionScope(moduleCode: string, functionCode: string): Promise<FunctionAuthorizationCode> {
    const selectedRole = this.authService.getSelectedRole();
    if (!selectedRole) {
      console.warn('[FunctionAuthorizationService] getFunctionScope() -> ruolo selezionato mancante', {
        moduleCode,
        functionCode
      });
      return 'deny';
    }

    await this.ensureLoaded(selectedRole);

    const resolvedScope = this.functionScopes.get(this.getFunctionKey(moduleCode, functionCode))
      ?? this.toFunctionScope(this.moduleScopes.get(moduleCode))
      ?? 'deny';

    console.info('[FunctionAuthorizationService] getFunctionScope() -> scope risolto', {
      selectedRole,
      moduleCode,
      functionCode,
      moduleScope: this.moduleScopes.get(moduleCode) ?? null,
      explicitFunctionScope: this.functionScopes.get(this.getFunctionKey(moduleCode, functionCode)) ?? null,
      resolvedScope
    });

    return resolvedScope;
  }

  private async ensureLoaded(roleId: string): Promise<void> {
    if (this.loadedRoleId === roleId && this.loadingPromise === null) {
      return;
    }

    if (this.loadingPromise) {
      await this.loadingPromise;
      return;
    }

    this.loadingPromise = this.loadAuthorizations(roleId);
    try {
      await this.loadingPromise;
      this.loadedRoleId = roleId;
    } finally {
      this.loadingPromise = null;
    }
  }

  private async loadAuthorizations(roleId: string): Promise<void> {
    const matrix = await firstValueFrom(
      this.http.get<AuthorizationRoleMatrixDto>(`${environment.apiBaseUrl}/authorizations/roles/${roleId}`)
    );

    this.moduleScopes = new Map(
      (matrix.modules ?? []).map((module) => [module.moduleCode, module.moduleAuthorization])
    );

    this.functionScopes = new Map(
      (matrix.modules ?? []).flatMap((module) =>
        (module.functions ?? []).map((authorization) => [
          this.getFunctionKey(module.moduleCode, authorization.functionCode),
          authorization.authorization
        ] as const)
      )
    );

    console.info('[FunctionAuthorizationService] loadAuthorizations() -> matrice caricata', {
      roleId,
      modules: (matrix.modules ?? []).map((module) => ({
        moduleCode: module.moduleCode,
        moduleAuthorization: module.moduleAuthorization,
        functions: (module.functions ?? []).map((authorization) => ({
          functionCode: authorization.functionCode,
          authorization: authorization.authorization
        }))
      }))
    });
  }

  private getFunctionKey(moduleCode: string, functionCode: string): string {
    return `${moduleCode}::${functionCode}`;
  }

  private toFunctionScope(moduleScope?: ModuleAuthorizationCode): FunctionAuthorizationCode | undefined {
    if (!moduleScope) {
      return undefined;
    }

    return moduleScope === 'allow' ? 'allow' : 'deny';
  }

  private resetCache(): void {
    this.loadedRoleId = '';
    this.loadingPromise = null;
    this.moduleScopes.clear();
    this.functionScopes.clear();
  }
}