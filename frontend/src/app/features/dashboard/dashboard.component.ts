import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { STRUCTURE_MODULE_CODES } from '../../core/structure-module-codes';
import { MessageKey, t } from '../../i18n/messages';
import { environment } from '../../../environments/environment';
import { AppointmentsDailyComponent } from '../appointments/appointments-daily/appointments-daily.component';
import { AppointmentsCalendarComponent } from '../appointments/appointments-calendar/appointments-calendar.component';

interface AuthorizationModuleDto {
  moduleCode: string;
  moduleAuthorization: 'full-edit' | 'read-only' | 'hide-field';
}

interface AuthorizationRoleMatrixDto {
  roleId: string;
  modules: AuthorizationModuleDto[];
  isNurseRole?: boolean;
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
  imports: [CommonModule, RouterLink, AppointmentsDailyComponent, AppointmentsCalendarComponent],
  template: `
    <div class="card">
      <h2>{{ translate('dashboard.tenant.title') }}</h2>
      <p style="margin: 4px 0 16px 0; color:#4b5563;" *ngIf="selectedClient || selectedRole">
        <strong>{{ translate('common.client') }}:</strong> {{ selectedClient || '-' }} |
        <strong>{{ translate('common.role') }}:</strong> {{ selectedRole || '-' }}
      </p>

      <ng-container *ngIf="roleLoaded">
        <ng-container *ngIf="!isNurseRole">
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
        </ng-container>
        <ng-container *ngIf="isNurseRole">
          <div style="display: flex; gap: 24px; margin-top: 24px; align-items: flex-start;">
            <div class="dashboard-card" style="min-width:420px;max-width:600px;flex:2;">
              <app-appointments-daily></app-appointments-daily>
            </div>
            <div class="dashboard-card" style="min-width:420px;max-width:600px;flex:2;">
              <app-appointments-calendar></app-appointments-calendar>
            </div>
          </div>
        </ng-container>
      </ng-container>
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
        margin-bottom: 8px;
      }

      .dashboard-link:hover {
        background: #f3f4f6;
      }

      .dashboard-card {
        flex: 1 1 0;
        background: #f3f4f6;
        border-radius: 12px;
        padding: 24px 20px;
        min-width: 260px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }
      .dashboard-card h3 {
        margin-top: 0;
        margin-bottom: 8px;
        font-size: 1.2rem;
        color: #2563eb;
      }
      .dashboard-card p {
        margin: 0;
        color: #374151;
      }
    `
  ]
})
export class DashboardComponent implements OnInit {
  selectedRole = '';
  selectedClient = '';
  hiddenModuleCodes = new Set<string>();
  isNurseRole = false;
  roleLoaded = false;

  readonly dashboardLinks: DashboardLink[] = [
    { route: '/users', labelKey: 'menu.usersSearch', moduleCode: 'USER' },
    { route: '/roles', labelKey: 'roles.search.title', moduleCode: 'ROLE' },
    { route: '/modules/search', labelKey: 'menu.modulesSearch', moduleCode: 'MODULE' },
    { route: '/functions/search', labelKey: 'menu.functionsSearch', moduleCode: 'FUNCTION' },
    { route: '/structures/asl', labelKey: 'menu.structure.aslSearch', moduleCode: STRUCTURE_MODULE_CODES.ASL },
    { route: '/patients/search', labelKey: 'menu.patientsSearch', moduleCode: 'PATIENT' },
    { route: '/doctors/search', labelKey: 'menu.doctorsSearch', moduleCode: 'DOCTOR' },
    { route: '/nurses/search', labelKey: 'menu.nursesSearch', moduleCode: 'NURSE' },
    { route: '/therapeutic-plans/search', labelKey: 'menu.therapeuticPlansSearch', moduleCode: 'THERAPEUTIC_PLAN' }
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient
  ) {}

  get visibleDashboardLinks(): DashboardLink[] {
    // Se ruolo infermiere, nessun pulsante
    if (this.isNurseRole) return [];
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
      this.isNurseRole = false;
      this.roleLoaded = true;
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
          this.isNurseRole = !!matrix.isNurseRole;
          this.roleLoaded = true;
        },
        error: () => {
          this.hiddenModuleCodes.clear();
          this.isNurseRole = false;
          this.roleLoaded = true;
        }
      });
  }
}