import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { MessageKey, hasMessageKey, t } from '../../i18n/messages';
import { environment } from '../../../environments/environment';

type ModuleAuthorizationCode = 'allow' | 'deny';
type FieldAuthorizationCode = 'full-edit' | 'read-only' | 'hide-field';
type FunctionAuthorizationCode = 'allow' | 'deny';

interface RoleDto {
  id: string;
  name?: string;
  description: string;
}

interface AuthorizationFieldDto {
  fieldName: string;
  authorization: FieldAuthorizationCode;
}

interface AuthorizationFunctionDto {
  functionCode: string;
  functionName: string;
  authorization: FunctionAuthorizationCode;
  commonFunction: boolean;
}

interface AuthorizationModuleDto {
  moduleCode: string;
  moduleName: string;
  entityName: string;
  moduleAuthorization: ModuleAuthorizationCode;
  fields: AuthorizationFieldDto[];
  functions: AuthorizationFunctionDto[];
}

interface AuthorizationRoleMatrixDto {
  roleId: string;
  modules: AuthorizationModuleDto[];
}

const MODULE_TITLE_KEYS: Record<string, MessageKey> = {
  USER: 'menu.users',
  PATIENT: 'menu.patients',
  DOCTOR: 'menu.doctors',
  NURSE: 'menu.nurses',
  ROLE: 'menu.roles',
  MODULE: 'menu.modules',
  FUNCTION: 'menu.functions',
  STRUCTURE: 'menu.structures',
  PROJECT: 'menu.projects',
  TENANT: 'menu.tenants'
};

const MODULE_MESSAGE_PREFIXES: Record<string, string> = {
  USER: 'users',
  PATIENT: 'patients',
  DOCTOR: 'doctors',
  NURSE: 'nurses',
  ROLE: 'roles',
  MODULE: 'modules',
  FUNCTION: 'functions',
  STRUCTURE: 'structures',
  PROJECT: 'projects'
};

const MODULE_DISPLAY_ORDER = ['USER', 'PATIENT', 'DOCTOR', 'NURSE', 'ROLE', 'MODULE', 'FUNCTION', 'STRUCTURE', 'PROJECT', 'TENANT'];

@Component({
  selector: 'app-authorizations-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './authorizations-management.component.html',
  styleUrl: './authorizations-management.component.css'
})
export class AuthorizationsManagementComponent implements OnInit {
    // Stato temporaneo per la regola selezionata per ogni modulo
    fieldBulkRule: { [moduleCode: string]: FieldAuthorizationCode } = {};
    // Applica la regola selezionata a tutti gli attributi del modulo
    applyRuleToAllFields(module: AuthorizationModuleDto): void {
      const rule = this.fieldBulkRule[module.moduleCode];
      if (!rule) return;
      (module.fields ?? []).forEach(field => field.authorization = rule);
    }
  roles: RoleDto[] = [];
  selectedRoleId = '';
  modules: AuthorizationModuleDto[] = [];
  expandedModuleCodes = new Set<string>();
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  readonly moduleScopeOptions: { value: ModuleAuthorizationCode; labelKey: MessageKey }[] = [
    { value: 'allow', labelKey: 'authorizations.scope.allow' },
    { value: 'deny', labelKey: 'authorizations.scope.deny' }
  ];

  readonly fieldScopeOptions: { value: FieldAuthorizationCode; labelKey: MessageKey }[] = [
    { value: 'full-edit', labelKey: 'authorizations.scope.fullEdit' },
    { value: 'read-only', labelKey: 'authorizations.scope.readOnly' },
    { value: 'hide-field', labelKey: 'authorizations.scope.hideField' }
  ];

  readonly functionScopeOptions: { value: FunctionAuthorizationCode; labelKey: MessageKey }[] = [
    { value: 'allow', labelKey: 'authorizations.scope.allow' },
    { value: 'deny', labelKey: 'authorizations.scope.deny' }
  ];

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.selectedRoleId = this.authService.getSelectedRole();
    this.loadRoles();
  }

  public translate(key: MessageKey): string {
    return t(key);
  }

  public onRoleChange(): void {
    this.authService.setSelectedRole(this.selectedRoleId);
    this.loadMatrixForSelectedRole();
  }

  public save(): void {
    if (!this.selectedRoleId || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http
      .put<AuthorizationRoleMatrixDto>(
        `${environment.apiBaseUrl}/authorizations/roles/${this.selectedRoleId}`,
        { modules: this.modules }
      )
      .subscribe({
        next: (matrix: AuthorizationRoleMatrixDto) => {
          this.modules = this.sortModules(matrix.modules ?? []);
          this.syncExpandedModules();
          this.successMessage = this.translate('authorizations.success.save');
          this.saving = false;
        },
        error: () => {
          this.errorMessage = this.translate('authorizations.error.save');
          this.saving = false;
        }
      });
  }

  public getScopeLabel(scope: string): string {
    switch (scope) {
      case 'allow':
        return this.translate('authorizations.scope.allow');
      case 'deny':
        return this.translate('authorizations.scope.deny');
      case 'full-edit':
        return this.translate('authorizations.scope.fullEdit');
      case 'read-only':
        return this.translate('authorizations.scope.readOnly');
      case 'hide-field':
        return this.translate('authorizations.scope.hideField');
      default:
        return scope;
    }
  }

  public getScopeIcon(scope: string): string {
    switch (scope) {
      case 'allow':
        return '✓';
      case 'deny':
        return '⊘';
      case 'full-edit':
        return '✎';
      case 'read-only':
        return '◐';
      case 'hide-field':
        return '◌';
      default:
        return '?';
    }
  }

  public getScopeIconClass(scope: string): string {
    switch (scope) {
      case 'allow':
      case 'full-edit':
        return 'authz-state-icon-allow';
      case 'read-only':
        return 'authz-state-icon-readonly';
      case 'deny':
      case 'hide-field':
        return 'authz-state-icon-deny';
      default:
        return 'authz-state-icon-neutral';
    }
  }

  public toggleModule(moduleCode: string): void {
    if (this.expandedModuleCodes.has(moduleCode)) {
      this.expandedModuleCodes.delete(moduleCode);
      return;
    }

    this.expandedModuleCodes.add(moduleCode);
  }

  public translateModuleLabel(module: AuthorizationModuleDto): string {
    const moduleKey = this.getModuleTitleKey(module.moduleCode);
    return moduleKey ? this.translate(moduleKey) : module.moduleName;
  }

  public isModuleExpanded(moduleCode: string): boolean {
    return this.expandedModuleCodes.has(moduleCode);
  }

  public hasFieldRows(module: AuthorizationModuleDto): boolean {
    return (module.fields ?? []).length > 0;
  }

  public hasFunctionRows(module: AuthorizationModuleDto): boolean {
    return (module.functions ?? []).length > 0;
  }

  public getCommonFunctions(module: AuthorizationModuleDto): AuthorizationFunctionDto[] {
    return (module.functions ?? []).filter((functionItem) => functionItem.commonFunction);
  }

  public getCustomFunctions(module: AuthorizationModuleDto): AuthorizationFunctionDto[] {
    return (module.functions ?? []).filter((functionItem) => !functionItem.commonFunction);
  }

  public translateFieldLabel(module: AuthorizationModuleDto, fieldName: string): string {
    const prefix = this.getModuleMessagePrefix(module.moduleCode);
    if (!prefix) {
      return fieldName;
    }

    const key = `${prefix}.field.${fieldName}`;
    return hasMessageKey(key) ? t(key) : fieldName;
  }

  private loadRoles(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<RoleDto[]>(`${environment.apiBaseUrl}/roles`).subscribe({
      next: (roles: RoleDto[]) => {
        this.roles = [...(roles ?? [])].sort((left, right) => left.id.localeCompare(right.id));

        if (!this.selectedRoleId || !this.roles.some((role) => role.id === this.selectedRoleId)) {
          this.selectedRoleId = this.roles[0]?.id ?? '';
        }

        if (this.selectedRoleId) {
          this.authService.setSelectedRole(this.selectedRoleId);
          this.loadMatrixForSelectedRole();
          return;
        }

        this.modules = [];
        this.loading = false;
      },
      error: () => {
        this.roles = [];
        this.modules = [];
        this.loading = false;
        this.errorMessage = this.translate('authorizations.error.loadRoles');
      }
    });
  }

  private loadMatrixForSelectedRole(): void {
    if (!this.selectedRoleId) {
      this.modules = [];
      this.loading = false;
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http
      .get<AuthorizationRoleMatrixDto>(`${environment.apiBaseUrl}/authorizations/roles/${this.selectedRoleId}`)
      .subscribe({
        next: (matrix: AuthorizationRoleMatrixDto) => {
          this.modules = this.sortModules(matrix.modules ?? []);
          this.syncExpandedModules();
          this.loading = false;
        },
        error: () => {
          this.modules = [];
          this.loading = false;
          this.errorMessage = this.translate('authorizations.error.loadMatrix');
        }
      });
  }

  private sortModules(modules: AuthorizationModuleDto[]): AuthorizationModuleDto[] {
    return [...modules].sort((left, right) => {
      const leftIndex = this.getModuleOrder(left.moduleCode);
      const rightIndex = this.getModuleOrder(right.moduleCode);
      if (leftIndex !== rightIndex) {
        return leftIndex - rightIndex;
      }

      return left.moduleCode.localeCompare(right.moduleCode);
    });
  }

  private syncExpandedModules(): void {
    if (this.modules.length === 0) {
      this.expandedModuleCodes.clear();
      return;
    }

    const availableCodes = new Set(this.modules.map((module) => module.moduleCode));
    this.expandedModuleCodes = new Set(
      [...this.expandedModuleCodes].filter((moduleCode) => availableCodes.has(moduleCode))
    );
  }

  private getModuleOrder(moduleCode: string): number {
    const index = MODULE_DISPLAY_ORDER.indexOf(moduleCode);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  }

  private getModuleTitleKey(moduleCode: string): MessageKey | null {
    return MODULE_TITLE_KEYS[moduleCode] ?? null;
  }

  private getModuleMessagePrefix(moduleCode: string): string | null {
    return MODULE_MESSAGE_PREFIXES[moduleCode] ?? null;
  }
}
