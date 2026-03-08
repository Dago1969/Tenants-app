import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { MessageKey, t } from '../../i18n/messages';
import { environment } from '../../../environments/environment';

interface AuthorizationModuleDto {
  moduleCode: string;
  moduleAuthorization: 'full-edit' | 'read-only' | 'hide-field';
}

interface AuthorizationRoleMatrixDto {
  roleId: string;
  modules: AuthorizationModuleDto[];
}

interface DashboardLink {
  route: string;
  labelKey: MessageKey;
  moduleCode?: string;
}

/**
 * Dashboard di atterraggio tenants con riepilogo client/ruolo selezionati da QTMDashboard.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="card">
      <h2>{{ translate('dashboard.tenant.title') }}</h2>
      <p style="margin: 4px 0 16px 0; color:#4b5563;" *ngIf="selectedClient || selectedRole">
        <strong>{{ translate('common.client') }}:</strong> {{ selectedClient || '-' }} |
        <strong>{{ translate('common.role') }}:</strong> {{ selectedRole || '-' }}
      </p>

      <p style="margin: 0 0 16px 0;">{{ translate('dashboard.tenant.selectArea') }}</p>

      <div class="dashboard-grid">
        <a
          class="dashboard-link"
          *ngFor="let link of visibleDashboardLinks"
          [routerLink]="link.route"
        >
          {{ translate(link.labelKey) }}
        </a>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;
      }

      .dashboard-link {
        display: block;
        text-decoration: none;
        text-align: center;
        padding: 14px 10px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        color: #111827;
        background: #f9fafb;
        font-weight: 600;
      }

      .dashboard-link:hover {
        background: #f3f4f6;
      }
    `
  ]
})
export class DashboardComponent implements OnInit {
  selectedRole = '';
  selectedClient = '';
  hiddenModuleCodes = new Set<string>();

  readonly dashboardLinks: DashboardLink[] = [
    { route: '/users/search', labelKey: 'menu.usersSearch', moduleCode: 'USER' },
    { route: '/roles', labelKey: 'roles.search.title', moduleCode: 'ROLE' },
    { route: '/modules/search', labelKey: 'menu.modulesSearch', moduleCode: 'MODULE' },
    { route: '/functions/search', labelKey: 'menu.functionsSearch', moduleCode: 'FUNCTION' },
    { route: '/structures/asl', labelKey: 'menu.structure.aslSearch', moduleCode: 'STRUCTURE' },
    { route: '/patients/search', labelKey: 'menu.patientsSearch', moduleCode: 'PATIENT' },
    { route: '/medics/search', labelKey: 'menu.medicsSearch', moduleCode: 'MEDIC' },
    { route: '/nurses/search', labelKey: 'menu.nursesSearch', moduleCode: 'NURSE' }
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient
  ) {}

  get visibleDashboardLinks(): DashboardLink[] {
    return this.dashboardLinks.filter((link) => !link.moduleCode || !this.hiddenModuleCodes.has(link.moduleCode));
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  ngOnInit(): void {
    this.selectedRole = this.authService.getSelectedRole();
    this.selectedClient = this.authService.getSelectedClient();
    this.loadModuleVisibility();
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
              .filter((module) => module.moduleAuthorization === 'hide-field')
              .map((module) => module.moduleCode)
          );
        },
        error: () => {
          this.hiddenModuleCodes.clear();
        }
      });
  }
}