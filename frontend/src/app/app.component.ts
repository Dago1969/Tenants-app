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
    { labelKey: 'menu.users', route: '/users', moduleCode: 'USER' },
    { labelKey: 'menu.usersSearch', route: '/users/search', moduleCode: 'USER' },
    { labelKey: 'menu.roles', route: '/roles', moduleCode: 'ROLE' },
    { labelKey: 'menu.roles.new', route: '/roles/new', moduleCode: 'ROLE' },
    { labelKey: 'menu.modules', route: '/modules', moduleCode: 'MODULE' },
    { labelKey: 'menu.modulesSearch', route: '/modules/search', moduleCode: 'MODULE' },
    { labelKey: 'menu.functions', route: '/functions', moduleCode: 'FUNCTION' },
    { labelKey: 'menu.functionsSearch', route: '/functions/search', moduleCode: 'FUNCTION' },
    { labelKey: 'menu.authorizations', route: '/authorizations' },
    { labelKey: 'menu.controllerFunctionMappings', route: '/controller-function-mappings' },
    { labelKey: 'menu.authorizationFunctions', route: '/authorization-functions' },
    { labelKey: 'menu.authorizationFunctionsSearch', route: '/authorization-functions/search' }
  ];

  registryMenuItems: MenuItem[] = [
    { labelKey: 'menu.patients', route: '/patients', moduleCode: 'PATIENT' },
    { labelKey: 'menu.patientsSearch', route: '/patients/search', moduleCode: 'PATIENT' },
    { labelKey: 'menu.medics', route: '/medics', moduleCode: 'MEDIC' },
    { labelKey: 'menu.medicsSearch', route: '/medics/search', moduleCode: 'MEDIC' },
    { labelKey: 'menu.nurses', route: '/nurses', moduleCode: 'NURSE' },
    { labelKey: 'menu.nursesSearch', route: '/nurses/search', moduleCode: 'NURSE' }
  ];

  structureMenuItems: MenuItem[] = [
    { labelKey: 'menu.structure.asl', route: '/structures/asl', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.structure.hospital', route: '/structures/hospitals', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.structure.hospitalPharmacy', route: '/structures/hospital-pharmacies', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.structure.retailPharmacy', route: '/structures/retail-pharmacies', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.structure.logisticsWarehouse', route: '/structures/logistics-warehouses', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.structure.materialWarehouse', route: '/structures/material-warehouses', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.structure.pharmaCompany', route: '/structures/pharma-companies', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.structure.specialistClinic', route: '/structures/specialist-clinics', moduleCode: 'STRUCTURE' },
    { labelKey: 'menu.structure.vendor', route: '/structures/vendors', moduleCode: 'STRUCTURE' }
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
