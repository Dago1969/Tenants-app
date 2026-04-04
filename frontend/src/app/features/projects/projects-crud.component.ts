import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ProjectAdministratorDto, ProjectApiService, ProjectDto } from '../../core/project-api.service';
import { RoleApiService, RoleDto } from '../../core/role-api.service';
import { QtmStepModalComponent } from '../../shared/qtm-step-modal.component';
import { TenantPointerApiService, TenantAppPointerDto } from '../../core/tenant-pointer-api.service';
import { UserApiService, UserDto } from '../../core/user-api.service';
import { MessageKey, t } from '../../i18n/messages';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

interface WizardStep {
  key: 'general' | 'administrators' | 'roles' | 'modules' | 'summary';
  titleKey: MessageKey;
}

interface ProjectModuleOption {
  code: string;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
  core?: boolean;
}

interface AdministratorOption extends ProjectAdministratorDto {
  label: string;
  roleLabel: string;
  rolePriority: number;
  searchRoleId: string;
}

interface ResolvedProjectAdministratorRole {
  id: string;
  label: string;
  priority: number;
}

/**
 * Wizard di inserimento e modifica progetti con riepilogo dei dati configurati.
 */
@Component({
  selector: 'app-projects-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, QtmStepModalComponent],
  templateUrl: './projects-crud.component.html',
  styleUrl: './projects-crud.component.css'
})
export class ProjectsCrudComponent implements OnInit {
  readonly titleKey = 'projects.wizard.title' as const;
  readonly steps: WizardStep[] = [
    { key: 'general', titleKey: 'projects.wizard.step.general.title' },
    { key: 'administrators', titleKey: 'projects.wizard.step.administrators.title' },
    { key: 'roles', titleKey: 'projects.wizard.step.roles.title' },
    { key: 'modules', titleKey: 'projects.wizard.step.modules.title' },
    { key: 'summary', titleKey: 'projects.wizard.step.summary.title' }
  ];

  readonly moduleOptions: ProjectModuleOption[] = [
    { code: 'DOCTOR', labelKey: 'projects.modules.doctor', descriptionKey: 'projects.modules.doctor.description', core: true },
    { code: 'PATIENT', labelKey: 'projects.modules.patient', descriptionKey: 'projects.modules.patient.description', core: true },
    { code: 'THERAPEUTIC_PLAN', labelKey: 'projects.modules.therapeuticPlan', descriptionKey: 'projects.modules.therapeuticPlan.description', core: true },
    { code: 'ADVERSE_EVENTS', labelKey: 'projects.modules.adverseEvents', descriptionKey: 'projects.modules.adverseEvents.description' },
    { code: 'WAREHOUSE', labelKey: 'projects.modules.warehouse', descriptionKey: 'projects.modules.warehouse.description' },
    { code: 'MOOD_TRACKING', labelKey: 'projects.modules.moodTracking', descriptionKey: 'projects.modules.moodTracking.description' }
  ];

  readonly coreModuleCodes = new Set(this.moduleOptions.filter((option) => option.core).map((option) => option.code));

  currentStepIndex = 0;
  loading = true;
  saving = false;
  isViewMode = false;
  projectId: number | null = null;
  tenantPointer: TenantAppPointerDto | null = null;
  adminOptions: AdministratorOption[] = [];
  errorMessage = '';
  project: ProjectDto = this.createEmptyProject();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly tenantPointerApi: TenantPointerApiService,
    private readonly projectApi: ProjectApiService,
    private readonly userApi: UserApiService,
    private readonly roleApi: RoleApiService
  ) {}

  ngOnInit(): void {
    this.isViewMode = this.route.snapshot.queryParamMap.get('mode') === 'view';
    const routeId = this.route.snapshot.paramMap.get('id');
    this.projectId = routeId ? Number(routeId) : null;
    this.loadInitialData();
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  get currentStep(): WizardStep {
    return this.steps[this.currentStepIndex];
  }

  get isFirstStep(): boolean {
    return this.currentStepIndex === 0;
  }

  get isLastStep(): boolean {
    return this.currentStepIndex === this.steps.length - 1;
  }

  get selectedModuleLabels(): string[] {
    return this.moduleOptions
      .filter((option) => this.project.enabledModuleCodes?.includes(option.code))
      .map((option) => this.translate(option.labelKey));
  }

  getAdministratorRoleLabel(administrator: ProjectAdministratorDto): string {
    const matchingOption = this.adminOptions.find((option) => option.userId === administrator.userId && option.roleId === administrator.roleId);
    return matchingOption?.roleLabel ?? this.formatRoleLabel(administrator.roleId);
  }

  get currentStepDescription(): string {
    switch (this.currentStep.key) {
      case 'administrators':
        return this.translate('projects.wizard.step.administrators.description');
      case 'roles':
        return this.translate('projects.wizard.step.roles.empty');
      case 'modules':
        return this.translate('projects.wizard.step.modules.description');
      case 'summary':
        return this.translate('projects.wizard.step.summary.heading');
      case 'general':
      default:
        return this.translate('projects.wizard.subtitle');
    }
  }

  previousStep(): void {
    if (!this.isFirstStep) {
      this.currentStepIndex -= 1;
    }
  }

  nextStep(): void {
    if (this.canLeaveCurrentStep() && !this.isLastStep) {
      this.currentStepIndex += 1;
    }
  }

  goToStep(index: number): void {
    if (index < 0 || index >= this.steps.length) {
      return;
    }

    if (index > this.currentStepIndex && !this.canLeaveCurrentStep()) {
      return;
    }

    this.currentStepIndex = index;
  }

  isCoreModule(code: string): boolean {
    return this.coreModuleCodes.has(code);
  }

  isModuleSelected(code: string): boolean {
    return this.project.enabledModuleCodes?.includes(code) ?? false;
  }

  toggleModule(code: string, checked: boolean): void {
    if (this.isViewMode || this.isCoreModule(code)) {
      return;
    }

    const current = new Set(this.project.enabledModuleCodes ?? []);
    if (checked) {
      current.add(code);
    } else {
      current.delete(code);
    }
    this.project.enabledModuleCodes = this.withCoreModules([...current]);
  }

  isAdministratorSelected(option: AdministratorOption): boolean {
    return (this.project.administrators ?? []).some((administrator) => administrator.userId === option.userId);
  }

  toggleAdministrator(option: AdministratorOption, checked: boolean): void {
    if (this.isViewMode) {
      return;
    }

    const currentAdministrators = [...(this.project.administrators ?? [])];
    this.project.administrators = checked
      ? [...currentAdministrators.filter((administrator) => administrator.userId !== option.userId), this.toAdministratorDto(option)]
      : currentAdministrators.filter((administrator) => administrator.userId !== option.userId);
  }

  save(): void {
    if (this.isViewMode || this.saving || !this.canLeaveCurrentStep()) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    const payload = this.buildPayload();
    const request = this.projectId === null
      ? this.projectApi.createProject(payload)
      : this.projectApi.updateProject(this.projectId, payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        void this.router.navigateByUrl('/projects/search');
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  cancel(): void {
    void this.router.navigateByUrl('/projects/search');
  }

  private loadInitialData(): void {
    const clientCode = this.authService.getSelectedClient().trim();
    const tenantRequest = clientCode
      ? this.tenantPointerApi.getTenantPointerByClientCode(clientCode).pipe(catchError(() => of(null)))
      : of(null);
    const projectRequest = this.projectId !== null
      ? this.projectApi.getProjectById(this.projectId).pipe(catchError(() => of(null)))
      : of(null);

    tenantRequest.pipe(
      switchMap((tenant) => this.loadAdministratorOptions().pipe(
        map((administrators) => ({ tenant, administrators }))
      )),
      switchMap(({ tenant, administrators }) => projectRequest.pipe(
        map((project) => ({ tenant, administrators, project }))
      ))
    ).subscribe({
      next: ({ tenant, administrators, project }) => {
        this.tenantPointer = tenant;
        this.adminOptions = administrators;
        this.project = project ? this.mergeLoadedProject(project, tenant) : this.createProjectFromTenant(tenant, clientCode);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = this.translate('projects.wizard.error.load');
        this.loading = false;
      }
    });
  }

  private loadAdministratorOptions() {
    return forkJoin({
      localRoles: this.roleApi.getRoles().pipe(catchError(() => of([] as RoleDto[]))),
      proxyRoles: this.roleApi.getProxyRoles().pipe(catchError(() => of([] as RoleDto[])))
    }).pipe(
      switchMap(({ localRoles, proxyRoles }) => {
        const adminRoles = localRoles
          .map((role) => ({
            role,
            projectRole: this.resolveProjectAdministratorRole(role, proxyRoles)
          }))
          .filter((entry): entry is { role: RoleDto; projectRole: ResolvedProjectAdministratorRole } => entry.projectRole !== null);

        if (adminRoles.length === 0) {
          return of([] as AdministratorOption[]);
        }

        return of(adminRoles).pipe(
          switchMap((resolvedRoles) =>
            resolvedRoles.length === 0
              ? of([] as AdministratorOption[])
              : of(resolvedRoles).pipe(
                  switchMap((currentRoles) =>
                    currentRoles.length === 0
                      ? of([] as AdministratorOption[])
                      : currentRoles.reduce(
                          (stream, currentRole) => stream.pipe(
                            switchMap((options) => this.userApi.searchUsers({ roleId: currentRole.role.id, enabled: true }).pipe(
                              catchError(() => of([] as UserDto[])),
                              map((users) => this.mergeAdministratorOptions(options, users, currentRole.role, currentRole.projectRole))
                            ))
                          ),
                          of([] as AdministratorOption[])
                        )
                  )
                )
          )
        );
      }),
      catchError(() => of([] as AdministratorOption[]))
    );
  }

  private mergeAdministratorOptions(
    existing: AdministratorOption[],
    users: UserDto[],
    role: RoleDto,
    projectRole: ResolvedProjectAdministratorRole
  ): AdministratorOption[] {
    const byUserId = new Map(existing.map((option) => [option.userId, option]));
    users.forEach((user) => {
      const existingOption = byUserId.get(user.id);
      const nextOption: AdministratorOption = {
        userId: user.id,
        roleId: projectRole.id,
        username: user.username,
        email: user.email,
        label: `${user.username} - ${user.email}`,
        roleLabel: projectRole.label,
        rolePriority: projectRole.priority,
        searchRoleId: role.id
      };

      if (!existingOption || nextOption.rolePriority > existingOption.rolePriority) {
        byUserId.set(user.id, nextOption);
      }
    });
    return [...byUserId.values()].sort((left, right) => left.label.localeCompare(right.label));
  }

  private resolveProjectAdministratorRole(role: RoleDto, proxyRoles: RoleDto[]): ResolvedProjectAdministratorRole | null {
    const directSourceRoleId = this.normalizeRoleText(role.sourceRoleId);
    if (directSourceRoleId) {
      return this.toResolvedAdministratorRole(role.sourceRoleId ?? role.id, role.description || role.name || role.id);
    }

    const normalizedLocalId = this.normalizeRoleText(role.id);
    const normalizedLocalName = this.normalizeRoleText(role.name);
    const normalizedLocalDescription = this.normalizeRoleText(role.description);

    const matchingProxyRole = proxyRoles.find((proxyRole) => {
      const proxyId = this.normalizeRoleText(proxyRole.id);
      const proxyName = this.normalizeRoleText(proxyRole.name);
      const proxyDescription = this.normalizeRoleText(proxyRole.description);

      return (normalizedLocalId !== null && proxyId === normalizedLocalId)
        || (normalizedLocalName !== null && proxyName === normalizedLocalName)
        || (normalizedLocalDescription !== null && proxyDescription === normalizedLocalDescription);
    });

    if (matchingProxyRole) {
      return this.toResolvedAdministratorRole(
        matchingProxyRole.id,
        matchingProxyRole.description || matchingProxyRole.name || matchingProxyRole.id
      );
    }

    return this.toResolvedAdministratorRole(role.id, role.description || role.name || role.id);
  }

  private toResolvedAdministratorRole(roleId: string, roleLabel: string): ResolvedProjectAdministratorRole | null {
    const normalizedRoleId = this.normalizeRoleText(roleId);
    if (normalizedRoleId === null) {
      return null;
    }

    if (normalizedRoleId === 'super_admin') {
      return {
        id: roleId,
        label: roleLabel,
        priority: 2
      };
    }

    if (normalizedRoleId === 'admin_qtm') {
      return {
        id: roleId,
        label: roleLabel,
        priority: 1
      };
    }

    return null;
  }

  private normalizeRoleText(value: string | undefined): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
  }

  private createEmptyProject(): ProjectDto {
    return {
      code: '',
      descrizione: '',
      clientCode: '',
      tenant: '',
      logo: '',
      footer: '',
      emailSender: '',
      dataInizio: '',
      dataFine: '',
      administrators: [],
      roleIds: [],
      enabledModuleCodes: [...this.coreModuleCodes]
    };
  }

  private createProjectFromTenant(tenant: TenantAppPointerDto | null, clientCode: string): ProjectDto {
    return {
      ...this.createEmptyProject(),
      clientCode: tenant?.clientCode ?? clientCode,
      tenant: tenant?.clientName ?? clientCode,
      tenantId: tenant?.id
    };
  }

  private mergeLoadedProject(project: ProjectDto, tenant: TenantAppPointerDto | null): ProjectDto {
    return {
      ...this.createProjectFromTenant(tenant, this.authService.getSelectedClient().trim()),
      ...project,
      administrators: [...(project.administrators ?? [])],
      roleIds: [...(project.roleIds ?? [])],
      enabledModuleCodes: this.withCoreModules(project.enabledModuleCodes ?? [])
    };
  }

  private withCoreModules(moduleCodes: string[]): string[] {
    const merged = new Set([...moduleCodes, ...this.coreModuleCodes]);
    return this.moduleOptions.map((option) => option.code).filter((code) => merged.has(code));
  }

  private toAdministratorDto(option: AdministratorOption): ProjectAdministratorDto {
    return {
      userId: option.userId,
      roleId: option.roleId,
      username: option.username,
      email: option.email
    };
  }

  private buildPayload(): ProjectDto {
    return {
      ...this.project,
      code: this.project.code.trim(),
      descrizione: this.project.descrizione.trim(),
      clientCode: this.project.clientCode?.trim(),
      tenant: this.project.tenant?.trim(),
      logo: this.project.logo?.trim(),
      footer: this.project.footer?.trim(),
      emailSender: this.project.emailSender?.trim(),
      administrators: [...(this.project.administrators ?? [])],
      roleIds: [],
      enabledModuleCodes: this.withCoreModules(this.project.enabledModuleCodes ?? [])
    };
  }

  private canLeaveCurrentStep(): boolean {
    this.errorMessage = '';

    switch (this.currentStep.key) {
      case 'general':
        if (!this.project.code.trim() || !this.project.descrizione.trim()) {
          this.errorMessage = this.translate('projects.wizard.validation.generalRequired');
          return false;
        }
        if (!this.project.clientCode?.trim() || !this.project.tenantId) {
          this.errorMessage = this.translate('projects.wizard.validation.tenantRequired');
          return false;
        }
        if (!this.project.emailSender?.trim()) {
          this.errorMessage = this.translate('projects.wizard.validation.emailSenderRequired');
          return false;
        }
        if (this.project.emailSender && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.project.emailSender)) {
          this.errorMessage = this.translate('projects.wizard.validation.emailSenderInvalid');
          return false;
        }
        if (!this.project.dataInizio || !this.project.dataFine) {
          this.errorMessage = this.translate('projects.wizard.validation.datesRequired');
          return false;
        }
        if (this.project.dataInizio > this.project.dataFine) {
          this.errorMessage = this.translate('projects.wizard.validation.dateRange');
          return false;
        }
        return true;
      case 'administrators':
        if ((this.project.administrators ?? []).length === 0) {
          this.errorMessage = this.translate('projects.wizard.validation.administratorRequired');
          return false;
        }
        return true;
      case 'modules':
        if ((this.project.enabledModuleCodes ?? []).length === 0) {
          this.errorMessage = this.translate('projects.wizard.validation.modulesRequired');
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  private formatRoleLabel(roleId: string): string {
    return roleId
      .split('_')
      .filter((part) => part.length > 0)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private resolveErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      const response = error as { error?: { detail?: string; message?: string } };
      return response.error?.detail ?? response.error?.message ?? this.translate('projects.wizard.error.save');
    }
    return this.translate('projects.wizard.error.save');
  }
}
