import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { MessageKey, t } from './i18n/messages';
import { environment } from '../environments/environment';
import { Subscription } from 'rxjs';

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
}

/**
 * Layout root con menu sinistro per accesso alle funzionalità CRUD tenants.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnDestroy {
    username: string | null = null;
    preferredUsername: string | null = null;
  selectedRole = '';
  selectedClient = '';
  hiddenModuleCodes = new Set<string>();
  managementMenuOpen = true;
  registryMenuOpen = true;
  structuresMenuOpen = true;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient
  ) {
    this.storeTokenFromQueryString();
    this.selectedRole = this.authService.getSelectedRole();
    this.selectedClient = this.authService.getSelectedClient();
    this.username = this.authService.getName();
    this.preferredUsername = this.authService.getPreferredUsername();
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
    { labelKey: 'menu.usersSearch', route: '/users/search', moduleCode: 'USER' },
    { labelKey: 'roles.search.title', route: '/roles', moduleCode: 'ROLE' },
    { labelKey: 'menu.modulesSearch', route: '/modules/search', moduleCode: 'MODULE' },
    { labelKey: 'menu.functionsSearch', route: '/functions/search', moduleCode: 'FUNCTION' },
    { labelKey: 'menu.structureTypesSearch', route: '/structure-types/search', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.authorizations', route: '/authorizations' },
    { labelKey: 'menu.controllerFunctionMappings', route: '/controller-function-mappings' },
    { labelKey: 'menu.operationLogsSearch', route: '/operation-logs/search' },
    { labelKey: 'menu.authorizationFunctionsSearch', route: '/authorization-functions/search' }
  ];

  registryMenuItems: MenuItem[] = [
    { labelKey: 'menu.patientsSearch', route: '/patients/search', moduleCode: 'PATIENT' },
    { labelKey: 'menu.medicsSearch', route: '/medics/search', moduleCode: 'MEDIC' },
    { labelKey: 'menu.nursesSearch', route: '/nurses/search', moduleCode: 'NURSE' }
  ];

  structureMenuItems: MenuItem[] = [
    { labelKey: 'menu.structure.aslSearch', route: '/structures/asl', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.structure.hospitalSearch', route: '/structures/hospitals', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.structure.hospitalPharmacySearch', route: '/structures/hospital-pharmacies', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.structure.retailPharmacySearch', route: '/structures/retail-pharmacies', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.structure.logisticsWarehouseSearch', route: '/structures/logistics-warehouses', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.structure.materialWarehouseSearch', route: '/structures/material-warehouses', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.structure.pharmaCompanySearch', route: '/structures/pharma-companies', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.structure.specialistClinicSearch', route: '/structures/specialist-clinics', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.structure.vendorSearch', route: '/structures/vendors', moduleCode: 'STRUCTURE' }
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

  toggleStructuresMenu(): void {
    this.structuresMenuOpen = !this.structuresMenuOpen;
  }

  toggleManagementMenu(): void {
    this.managementMenuOpen = !this.managementMenuOpen;
  }

  toggleRegistryMenu(): void {
    this.registryMenuOpen = !this.registryMenuOpen;
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private storeTokenFromQueryString(): void {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    const role = url.searchParams.get('role');
    const client = url.searchParams.get('client');

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

    if (token || role || client) {
      window.history.replaceState({}, document.title, url.toString());
    }
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
