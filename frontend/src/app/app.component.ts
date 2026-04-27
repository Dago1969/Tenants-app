import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { ProjectApiService, ProjectDto } from './core/project-api.service';
import { getCurrentLanguage, MessageKey, t } from './i18n/messages';
import { environment } from '../environments/environment';
import { Subscription } from 'rxjs';
import { STRUCTURE_MODULE_CODES } from './core/structure-module-codes';
import { HeaderComponent } from './shared/header.component';

interface AuthorizationModuleDto {
  moduleCode: string;
  moduleAuthorization: 'allow' | 'deny';
}

interface AuthorizationRoleMatrixDto {
  roleId: string;
  modules: AuthorizationModuleDto[];
}

interface MenuItem {
  labelKey: MessageKey;
  route: string;
  moduleCode?: string;
  iconSrc?: string;
}

/**
 * Layout root con menu sinistro per accesso alle funzionalità CRUD tenants.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnDestroy {
      // --- Helper functions (solo una versione, in fondo alla classe) ---
      // (Le versioni duplicate verranno rimosse in fondo al file)
    username: string | null = null;
    preferredUsername: string | null = null;
  selectedRole = '';
  selectedClient = '';
  selectedProject: string | null = null;
    projectFooterText: string | null = null;
  hiddenModuleCodes = new Set<string>();
  managementMenuOpen = false;
  registryMenuOpen = false;
  structuresMenuOpen = false;
  bulkImportMenuOpen = false;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient,
    private readonly projectApi: ProjectApiService
  ) {
    if (typeof document !== 'undefined') {
      document.title = t('app.title');
    }
    // Prima leggo dalla query string, se non c'è recupero da sessionStorage
    // Prima leggo dalla query string, se non c'è recupero da sessionStorage
    this.selectedProject = this.getProjectFromQueryString();
    if (!this.selectedProject) {
      this.selectedProject = this.authService.getSelectedProject() || null;
    }
    this.storeTokenFromQueryString();
    this.selectedRole = this.authService.getSelectedRole();
    this.selectedClient = this.authService.getSelectedClient();
    this.username = this.authService.getName();
    this.preferredUsername = this.authService.getPreferredUsername();
    this.loadProjectFooter();
    // Log info utente dal JWT
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Loggo tutti i claim disponibili
        console.log('[TENANTS-APP] JWT payload:', payload);
        console.log('[TENANTS-APP] getUsername():', this.username);
      } catch (e) {
        console.warn('[TENANTS-APP] Errore decodifica JWT:', e);
      }
    } else {
      console.warn('[TENANTS-APP] Nessun token JWT trovato');
    }
    this.loadModuleVisibility();

    this.subscriptions.add(
      this.authService.getSelectedRoleChanges().subscribe((role) => {
        this.selectedRole = role;
        this.loadModuleVisibility();
      })
    );
  }

  menuItems: MenuItem[] = [
    { labelKey: 'menu.dashboard', route: '/dashboard' }
  ];

  managementMenuItems: MenuItem[] = [
    { labelKey: 'menu.usersSearch', route: '/users', moduleCode: 'USER' },
    { labelKey: 'menu.otpVerification', route: '/otp/request' },
    { labelKey: 'roles.search.title', route: '/roles', moduleCode: 'ROLE' },
    { labelKey: 'menu.modulesSearch', route: '/modules/search', moduleCode: 'MODULE' },
    { labelKey: 'menu.functionsSearch', route: '/functions/search', moduleCode: 'FUNCTION' },
    { labelKey: 'projects.search.title', route: '/projects/search', moduleCode: 'PROJECT', iconSrc: 'assets/progetto.png' },
    { labelKey: 'menu.structureTypesSearch', route: '/structure-types/search', moduleCode: STRUCTURE_MODULE_CODES.GENERIC },
    { labelKey: 'menu.equipmentSearch', route: '/equipment/search', moduleCode: 'EQUIPMENT', iconSrc: 'assets/equipment.png' },
    { labelKey: 'menu.equipmentTypesSearch', route: '/equipment-types/search', moduleCode: 'EQUIPMENT_TYPE', iconSrc: 'assets/equipment.png' },
    { labelKey: 'menu.therapeuticPlansSearch', route: '/therapeutic-plans/search', moduleCode: 'THERAPEUTIC_PLAN' },
    { labelKey: 'menu.authorizations', route: '/authorizations' },
    { labelKey: 'menu.controllerFunctionMappings', route: '/controller-function-mappings' },
    { labelKey: 'menu.operationLogsSearch', route: '/operation-logs/search' },
    { labelKey: 'menu.authorizationFunctionsSearch', route: '/authorization-functions/search' }
  ];

  registryMenuItems: MenuItem[] = [
    { labelKey: 'menu.patientsSearch', route: '/patients/search', moduleCode: 'PATIENT' },
    { labelKey: 'menu.doctorsSearch', route: '/doctors/search', moduleCode: 'DOCTOR' },
    { labelKey: 'menu.nursesSearch', route: '/nurses/search', moduleCode: 'NURSE' },
    { labelKey: 'menu.therapeuticPlansSearch', route: '/therapeutic-plans/search', moduleCode: 'THERAPEUTIC_PLAN' }
  ];

  structureMenuItems: MenuItem[] = [
    { labelKey: 'menu.structure.aslSearch', route: '/structures/asl', moduleCode: STRUCTURE_MODULE_CODES.ASL, iconSrc: 'assets/asl.png' },
    { labelKey: 'menu.structure.hospitalSearch', route: '/structures/hospitals', moduleCode: STRUCTURE_MODULE_CODES.HOSPITAL, iconSrc: 'assets/hospital.png' },
    { labelKey: 'menu.structure.hospitalPharmacySearch', route: '/structures/hospital-pharmacies', moduleCode: STRUCTURE_MODULE_CODES.HOSPITAL_PHARMACY, iconSrc: 'assets/farmacy-O.png' },
    { labelKey: 'menu.structure.retailPharmacySearch', route: '/structures/retail-pharmacies', moduleCode: STRUCTURE_MODULE_CODES.RETAIL_PHARMACY, iconSrc: 'assets/farmacy-R.png' },
    { labelKey: 'menu.structure.logisticsWarehouseSearch', route: '/structures/logistics-warehouses', moduleCode: STRUCTURE_MODULE_CODES.LOGISTICS_WAREHOUSE, iconSrc: 'assets/logistic.png' },
    { labelKey: 'menu.structure.materialWarehouseSearch', route: '/structures/material-warehouses', moduleCode: STRUCTURE_MODULE_CODES.MATERIAL_WAREHOUSE, iconSrc: 'assets/dwh.png' },
    { labelKey: 'menu.structure.pharmaCompanySearch', route: '/structures/pharma-companies', moduleCode: STRUCTURE_MODULE_CODES.PHARMA_COMPANY, iconSrc: 'assets/farmaceutica.png' },
    { labelKey: 'menu.structure.specialistClinicSearch', route: '/structures/specialist-clinics', moduleCode: STRUCTURE_MODULE_CODES.SPECIALIST_CLINIC, iconSrc: 'assets/clinic.png' },
    { labelKey: 'menu.structure.vendorSearch', route: '/structures/vendors', moduleCode: STRUCTURE_MODULE_CODES.GENERIC, iconSrc: 'assets/fornitore.png' }
  ];

  bulkImportMenuItems: MenuItem[] = [
    { labelKey: 'menu.structure.bulkImport', route: '/imports/structures', moduleCode: STRUCTURE_MODULE_CODES.BULK_IMPORT }
  ];

  get visibleMenuItems(): MenuItem[] {
    return this.menuItems.filter((item) => !item.moduleCode || !this.hiddenModuleCodes.has(item.moduleCode));
  }

  get visibleStructureMenuItems(): MenuItem[] {
    return this.structureMenuItems.filter((item) => !item.moduleCode || !this.hiddenModuleCodes.has(item.moduleCode));
  }

  get visibleManagementMenuItems(): MenuItem[] {
    return this.managementMenuItems.filter((item) => !item.moduleCode || !this.hiddenModuleCodes.has(item.moduleCode));
  }

  get visibleRegistryMenuItems(): MenuItem[] {
    return this.registryMenuItems.filter((item) => !item.moduleCode || !this.hiddenModuleCodes.has(item.moduleCode));
  }

  get isManagementMenuVisible(): boolean {
    return this.visibleManagementMenuItems.length > 0;
  }

  get isRegistryMenuVisible(): boolean {
    return this.visibleRegistryMenuItems.length > 0;
  }

  get isStructureMenuVisible(): boolean {
    return this.visibleStructureMenuItems.length > 0;
  }

  get visibleBulkImportMenuItems(): MenuItem[] {
    return this.bulkImportMenuItems.filter((item) => !item.moduleCode || !this.hiddenModuleCodes.has(item.moduleCode));
  }

  get isBulkImportMenuVisible(): boolean {
    return this.visibleBulkImportMenuItems.length > 0;
  }

  toggleStructuresMenu(): void {
    this.structuresMenuOpen = !this.structuresMenuOpen;
  }

  toggleManagementMenu(): void {
    this.managementMenuOpen = !this.managementMenuOpen;
  }

  toggleRegistryMenu(): void {
    this.registryMenuOpen = !this.registryMenuOpen;
  }

  toggleBulkImportMenu(): void {
    this.bulkImportMenuOpen = !this.bulkImportMenuOpen;
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  private translateTemplate(key: string): string {
    return t(key);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  // --- Helper functions: solo una versione ---
  private loadProjectFooter(): void {
    const selectedClient = this.selectedClient.trim();
    const selectedProject = this.selectedProject?.trim() ?? '';

    if (!selectedClient || !selectedProject) {
      this.projectFooterText = null;
      return;
    }

    this.subscriptions.add(
      this.projectApi.getProjectsByTenant(selectedClient).subscribe({
        next: (projects) => {
          const matchedProject = projects.find((project) => this.matchesSelectedProject(project, selectedProject));
            this.projectFooterText = matchedProject ? this.buildProjectFooterText(matchedProject) : null;
        },
        error: () => {
            this.projectFooterText = null;
        }
      })
    );
  }

    private buildProjectFooterText(project: ProjectDto): string {
      const template = project.footer?.trim() || this.buildDefaultProjectFooter();
      return this.resolveProjectFooterTemplate(template, project);
  }

    private buildDefaultProjectFooter(): string {
      return this.normalizeFooterTemplate(this.translateTemplate('projects.footer.template'));
  }

  private normalizeFooterTemplate(template: string): string {
    return template.replace(/\\n/g, '\n');
  }

  private resolveProjectFooterTemplate(template: string, project: ProjectDto): string {
    const footerValues: Record<string, string> = {
      CodProgetto: this.formatFooterValue(project.code),
      descProgetto: this.formatFooterValue(project.descrizione),
      dataInizio: this.formatFooterValue(project.dataInizio),
      dataFine: this.formatFooterValue(project.dataFine),
      mail: this.formatFooterValue(project.emailSender)
    };

    return this.normalizeFooterTemplate(template).replace(/\{([^}]+)\}/g, (match, key) => footerValues[key] ?? match);
  }

  private formatFooterValue(value: string | null | undefined): string {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : '-';
  }

  private matchesSelectedProject(project: ProjectDto, selectedProject: string): boolean {
    const normalizedSelection = selectedProject.trim().toLowerCase();

    if (!normalizedSelection) {
      return false;
    }

    const projectCode = project.code?.trim().toLowerCase() ?? '';
    if (projectCode && projectCode === normalizedSelection) {
      return true;
    }

    const projectId = project.id?.toString() ?? '';
    return projectId === normalizedSelection;
  }

  private storeTokenFromQueryString(): void {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    const role = url.searchParams.get('role');
    const client = url.searchParams.get('client');
    const project = url.searchParams.get('project');
    if (project !== null && project.trim() !== '') {
      // Log progetto in console JS
      console.log('[TENANTS-APP][frontend] Progetto ricevuto dalla query string:', project);
      this.selectedProject = project;
      this.authService.setSelectedProject(project);
      url.searchParams.delete('project');
    } else if (project !== null) {
      this.selectedProject = null;
      this.authService.setSelectedProject('');
      url.searchParams.delete('project');
    }
    if (token) {
      this.authService.setToken(token);
      url.searchParams.delete('token');
    }
    if (role) {
      this.authService.setSelectedRole(role);
      url.searchParams.delete('role');
    }
    if (client) {
      this.authService.setSelectedClient(client);
      url.searchParams.delete('client');
    }
    if (token || role || client || project !== null) {
      window.history.replaceState({}, document.title, url.toString());
    }
  }

  private getProjectFromQueryString(): string | null {
    if (typeof window === 'undefined') return null;
    const url = new URL(window.location.href);
    return url.searchParams.get('project');
  }

  private loadModuleVisibility(): void {
    if (!this.selectedRole) {
      this.hiddenModuleCodes.clear();
      return;
    }
    this.http
      .get<AuthorizationRoleMatrixDto>(`${environment.apiBaseUrl}/authorizations/roles/${this.selectedRole}`)
      .subscribe({
        next: (matrix) => {
          this.hiddenModuleCodes = new Set(
            (matrix.modules ?? [])
              .filter((module) => module.moduleAuthorization === 'deny')
              .map((module) => module.moduleCode)
          );
        },
        error: () => {
          this.hiddenModuleCodes.clear();
        }
      });
  }
}
