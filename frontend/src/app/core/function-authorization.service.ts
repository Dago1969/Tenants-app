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
}

interface AuthorizationRoleMatrixDto {
  roleId: string;
  modules: AuthorizationModuleDto[];
}

interface FunctionAuthorizationDto {
  functionCode: string;
  moduleCode: string;
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
    return scope === 'allow';
  }

  async getFunctionScope(moduleCode: string, functionCode: string): Promise<FunctionAuthorizationCode> {
    const selectedRole = this.authService.getSelectedRole();
    if (!selectedRole) {
      return 'deny';
    }

    await this.ensureLoaded(selectedRole);

    return this.functionScopes.get(this.getFunctionKey(moduleCode, functionCode))
      ?? this.toFunctionScope(this.moduleScopes.get(moduleCode))
      ?? 'deny';
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
    const [matrix, functionAuthorizations] = await Promise.all([
      firstValueFrom(this.http.get<AuthorizationRoleMatrixDto>(`${environment.apiBaseUrl}/authorizations/roles/${roleId}`)),
      firstValueFrom(this.http.get<FunctionAuthorizationDto[]>(`${environment.apiBaseUrl}/authorization-functions/role/${roleId}`))
    ]);

    this.moduleScopes = new Map(
      (matrix.modules ?? []).map((module) => [module.moduleCode, module.moduleAuthorization])
    );

    this.functionScopes = new Map(
      (functionAuthorizations ?? []).map((authorization) => [
        this.getFunctionKey(authorization.moduleCode, authorization.functionCode),
        authorization.authorization
      ])
    );
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