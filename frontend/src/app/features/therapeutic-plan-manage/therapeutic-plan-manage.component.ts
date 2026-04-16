import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StructureApiService, StructureDto } from '../../core/structure-api.service';
import { MessageKey, t } from '../../i18n/messages';

interface TherapeuticPlanManageResponse {
  id?: number;
  patientId: number | null;
  projectCode: string;
  equipmentIds: number[];
  structureId: number | null;
  nurseId: number | null;
  doctorId: number | null;
  drugCode: string;
  startDate: string;
  endDate: string;
  status: string;
  notes: string;
}

interface TherapeuticPlanPatient {
  id: number;
  assistedId?: string;
  firstName?: string;
  lastName?: string;
  fiscalCode?: string;
  email?: string;
  primaryPhone?: string;
  city?: string;
  province?: string;
  deliveryAddress?: string;
  preferredContact?: string;
  prescribingSpecialist?: string;
  caregiverFullName?: string;
  caregiverPhone?: string;
}

interface TherapeuticPlanNurse {
  id: number;
  fullName: string;
}

interface TherapeuticPlanDoctor {
  id: number;
  fullName: string;
  specialization?: string;
}

interface TherapeuticPlanEquipment {
  id: number;
  code: string;
  equipmentTypeName?: string;
  status: string;
  serialNumber?: string;
}

interface TherapeuticPlanManageTab {
  key: 'summary' | 'patient' | 'modules' | 'visits' | 'activity-booking' | 'contact-requests';
  titleKey: MessageKey;
}

interface TherapeuticPlanSummarySubTab {
  key: 'notifications' | 'alerts';
  titleKey: MessageKey;
}

/**
 * Pagina di gestione del piano terapeutico con tab dedicati per riepilogo, paziente e aree operative collegate.
 */
@Component({
  selector: 'app-therapeutic-plan-manage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './therapeutic-plan-manage.component.html',
  styleUrl: './therapeutic-plan-manage.component.css'
})
export class TherapeuticPlanManageComponent implements OnInit {
  readonly tabs: TherapeuticPlanManageTab[] = [
    { key: 'summary', titleKey: 'therapeuticPlan.manage.tab.summary' },
    { key: 'patient', titleKey: 'therapeuticPlan.manage.tab.patient' },
    { key: 'modules', titleKey: 'therapeuticPlan.manage.tab.modules' },
    { key: 'visits', titleKey: 'therapeuticPlan.manage.tab.visits' },
    { key: 'activity-booking', titleKey: 'therapeuticPlan.manage.tab.activityBooking' },
    { key: 'contact-requests', titleKey: 'therapeuticPlan.manage.tab.contactRequests' }
  ];

  // Sotto-sezioni del riepilogo per separare contenuti informativi e segnalazioni operative.
  readonly summarySubTabs: TherapeuticPlanSummarySubTab[] = [
    { key: 'notifications', titleKey: 'therapeuticPlan.manage.subtab.notifications' },
    { key: 'alerts', titleKey: 'therapeuticPlan.manage.subtab.alerts' }
  ];

  loading = true;
  errorMessage = '';
  activeTab: TherapeuticPlanManageTab['key'] = 'summary';
  activeSummarySubTab: TherapeuticPlanSummarySubTab['key'] = 'notifications';
  planId: number | null = null;
  plan: TherapeuticPlanManageResponse | null = null;
  patient: TherapeuticPlanPatient | null = null;
  structure: StructureDto | null = null;
  nurse: TherapeuticPlanNurse | null = null;
  doctor: TherapeuticPlanDoctor | null = null;
  selectedEquipment: TherapeuticPlanEquipment[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly structureApiService: StructureApiService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const normalizedId = idParam ? Number(idParam) : Number.NaN;
    if (Number.isNaN(normalizedId) || normalizedId <= 0) {
      this.loading = false;
      this.errorMessage = this.translate('therapeuticPlan.manage.error.invalidId');
      return;
    }

    this.planId = normalizedId;
    this.loadManageData(normalizedId);
  }

  translate(key: MessageKey | string): string {
    try {
      return t(key as MessageKey);
    } catch {
      return key;
    }
  }

  setActiveTab(tabKey: TherapeuticPlanManageTab['key']): void {
    this.activeTab = tabKey;
  }

  setActiveSummarySubTab(tabKey: TherapeuticPlanSummarySubTab['key']): void {
    this.activeSummarySubTab = tabKey;
  }

  goBack(): void {
    void this.router.navigateByUrl('/therapeutic-plans/search');
  }

  get patientDisplayName(): string {
    if (!this.patient) {
      return this.translate('common.notAvailable');
    }

    const fullName = `${this.patient.firstName ?? ''} ${this.patient.lastName ?? ''}`.trim();
    return fullName || this.translate('common.notAvailable');
  }

  get patientCode(): string {
    return this.patient?.assistedId?.trim() || this.translate('common.notAvailable');
  }

  get structureLabel(): string {
    if (!this.structure) {
      return this.translate('common.notAvailable');
    }

    return this.structure.selectionLabel?.trim().length ? this.structure.selectionLabel : this.structure.name;
  }

  get nurseLabel(): string {
    return this.nurse?.fullName?.trim() || this.translate('common.notAvailable');
  }

  get doctorLabel(): string {
    return this.doctor?.fullName?.trim() || this.translate('common.notAvailable');
  }

  get statusLabelKey(): string {
    return `status.${this.plan?.status ?? 'unknown'}`;
  }

  get statusClass(): string {
    return `status-${this.plan?.status ?? 'unknown'}`;
  }

  get selectedEquipmentCount(): string {
    return String(this.selectedEquipment.length);
  }

  get alertKeys(): MessageKey[] {
    if (!this.plan) {
      return [];
    }

    const alerts: MessageKey[] = [];
    const normalizedToday = new Date();
    normalizedToday.setHours(0, 0, 0, 0);

    const endDate = this.plan.endDate?.trim() ? new Date(this.plan.endDate) : null;
    if (endDate && !Number.isNaN(endDate.getTime()) && endDate < normalizedToday && !['completed', 'cancelled'].includes(this.plan.status)) {
      alerts.push('therapeuticPlan.manage.alert.overdue');
    }

    if (!this.selectedEquipment.length) {
      alerts.push('therapeuticPlan.manage.alert.noEquipment');
    }

    if (!this.structure || !this.doctor || !this.nurse) {
      alerts.push('therapeuticPlan.manage.alert.incompleteCareTeam');
    }

    if (this.plan.status === 'suspended') {
      alerts.push('therapeuticPlan.manage.alert.suspended');
    }

    return alerts;
  }

  formatDate(value?: string): string {
    if (!value?.trim()) {
      return this.translate('common.notAvailable');
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(parsedDate);
  }

  private loadManageData(planId: number): void {
    forkJoin({
      plan: this.http.get<TherapeuticPlanManageResponse>(`${environment.apiBaseUrl}/therapeutic-plans/${planId}`),
      patients: this.http.get<TherapeuticPlanPatient[]>(`${environment.apiBaseUrl}/patients`).pipe(catchError(() => of([] as TherapeuticPlanPatient[]))),
      hospitals: this.structureApiService.getStructuresByType('HOSPITAL', true).pipe(catchError(() => of([] as StructureDto[]))),
      specialistClinics: this.structureApiService.getStructuresByType('SPECIALIST_CLINIC', true).pipe(catchError(() => of([] as StructureDto[]))),
      nurses: this.http.get<TherapeuticPlanNurse[]>(`${environment.apiBaseUrl}/nurses`).pipe(catchError(() => of([] as TherapeuticPlanNurse[]))),
      doctors: this.http.get<TherapeuticPlanDoctor[]>(`${environment.apiBaseUrl}/doctors`).pipe(catchError(() => of([] as TherapeuticPlanDoctor[]))),
      equipment: this.http.get<TherapeuticPlanEquipment[]>(`${environment.apiBaseUrl}/equipment`).pipe(catchError(() => of([] as TherapeuticPlanEquipment[])))
    }).subscribe({
      next: ({ plan, patients, hospitals, specialistClinics, nurses, doctors, equipment }) => {
        // Controllo progetto
        const currentProject = this.authService.getSelectedProject();
        if (plan.projectCode !== currentProject) {
          this.router.navigateByUrl('/forbidden');
          return;
        }
        this.plan = plan;
        this.patient = patients.find((currentPatient) => currentPatient.id === plan.patientId) ?? null;
        this.structure = [...hospitals, ...specialistClinics].find((currentStructure) => currentStructure.id === plan.structureId) ?? null;
        this.nurse = nurses.find((currentNurse) => currentNurse.id === plan.nurseId) ?? null;
        this.doctor = doctors.find((currentDoctor) => currentDoctor.id === plan.doctorId) ?? null;
        this.selectedEquipment = (equipment ?? []).filter((currentEquipment) => plan.equipmentIds?.includes(currentEquipment.id));
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    const detail = typeof error.error?.detail === 'string' ? error.error.detail.trim() : '';
    if (detail) {
      return detail;
    }

    const message = typeof error.error?.message === 'string' ? error.error.message.trim() : '';
    if (message) {
      return message;
    }

    return this.translate('crud.error.load');
  }
}