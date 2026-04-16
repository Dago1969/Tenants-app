import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StructureApiService, StructureDto } from '../../core/structure-api.service';
import { MessageKey, t } from '../../i18n/messages';
import { QtmStepModalComponent } from '../../shared/qtm-step-modal.component';

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

interface TherapeuticPlanAlert {
  id?: number;
  therapeuticPlanId: number;
  doctorId: number | null;
  doctorName?: string;
  date: string;
  subject: string;
  confirmationRequired: boolean;
  confirmationSent: string;
}

interface TherapeuticPlanAlertForm {
  date: string;
  subject: string;
  confirmationRequired: boolean;
  confirmationSent: 'yes' | 'no' | 'na';
}

/**
 * Pagina di gestione del piano terapeutico con tab dedicati per riepilogo, paziente e aree operative collegate.
 */
@Component({
  selector: 'app-therapeutic-plan-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, QtmStepModalComponent],
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
  alerts: TherapeuticPlanAlert[] = [];
  alertModalOpen = false;
  alertSaving = false;
  alertErrorMessage = '';
  editingAlertId: number | null = null;
  alertForm: TherapeuticPlanAlertForm = this.createEmptyAlertForm();

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

  get summaryNotificationKeys(): MessageKey[] {
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

  get canCreateAlert(): boolean {
    return !!this.planId && !!this.plan?.doctorId;
  }

  get alertConfirmationSentVisible(): boolean {
    return this.alertForm.confirmationRequired;
  }

  get isEditingAlert(): boolean {
    return this.editingAlertId !== null;
  }

  get alertModalTitleKey(): MessageKey {
    return this.isEditingAlert
      ? 'therapeuticPlan.alert.modal.titleEdit'
      : 'therapeuticPlan.alert.modal.title';
  }

  get alertSubmitLabelKey(): MessageKey {
    return this.isEditingAlert ? 'crud.actions.update' : 'crud.actions.create';
  }

  get confirmationSentLabel(): string {
    if (!this.alertConfirmationSentVisible) {
      return this.translate('therapeuticPlan.alert.confirmationSent.na');
    }

    return this.translate(this.alertForm.confirmationSent === 'yes'
      ? 'common.yes'
      : this.alertForm.confirmationSent === 'no'
        ? 'common.no'
        : 'therapeuticPlan.alert.confirmationSent.na');
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

  openAlertModal(): void {
    if (!this.canCreateAlert) {
      return;
    }

    this.alertErrorMessage = '';
    this.editingAlertId = null;
    this.alertForm = this.createEmptyAlertForm();
    this.alertModalOpen = true;
  }

  openAlertEditModal(alert: TherapeuticPlanAlert): void {
    if (!this.canCreateAlert || alert.id == null) {
      return;
    }

    this.alertErrorMessage = '';
    this.editingAlertId = alert.id;
    this.alertForm = {
      date: alert.date ?? '',
      subject: alert.subject ?? '',
      confirmationRequired: alert.confirmationRequired,
      confirmationSent: alert.confirmationRequired
        ? this.normalizeConfirmationSent(alert.confirmationSent)
        : 'na'
    };
    this.alertModalOpen = true;
  }

  closeAlertModal(): void {
    if (this.alertSaving) {
      return;
    }

    this.alertModalOpen = false;
    this.alertErrorMessage = '';
    this.editingAlertId = null;
    this.alertForm = this.createEmptyAlertForm();
  }

  onConfirmationRequiredChange(): void {
    if (!this.alertForm.confirmationRequired) {
      this.alertForm.confirmationSent = 'na';
    }
  }

  saveAlert(): void {
    if (!this.planId || !this.plan?.doctorId || this.alertSaving) {
      return;
    }

    this.alertErrorMessage = '';
    if (!this.alertForm.date.trim()) {
      this.alertErrorMessage = this.translate('therapeuticPlan.alert.validation.dateRequired');
      return;
    }
    if (!this.alertForm.subject.trim()) {
      this.alertErrorMessage = this.translate('therapeuticPlan.alert.validation.subjectRequired');
      return;
    }
    if (this.alertForm.confirmationRequired && !['yes', 'no'].includes(this.alertForm.confirmationSent)) {
      this.alertErrorMessage = this.translate('therapeuticPlan.alert.validation.confirmationSentRequired');
      return;
    }

    this.alertSaving = true;
    const payload: TherapeuticPlanAlert = {
      therapeuticPlanId: this.planId,
      doctorId: this.plan.doctorId,
      date: this.alertForm.date,
      subject: this.alertForm.subject.trim(),
      confirmationRequired: this.alertForm.confirmationRequired,
      confirmationSent: this.alertForm.confirmationRequired ? this.alertForm.confirmationSent : 'na'
    };

    const request = this.isEditingAlert && this.editingAlertId !== null
      ? this.http.put<TherapeuticPlanAlert>(
          `${environment.apiBaseUrl}/therapeutic-plans/${this.planId}/alerts/${this.editingAlertId}`,
          payload
        )
      : this.http.post<TherapeuticPlanAlert>(`${environment.apiBaseUrl}/therapeutic-plans/${this.planId}/alerts`, payload);

    request.subscribe({
      next: (savedAlert) => {
        this.alertSaving = false;
        this.alerts = this.sortAlerts([
          savedAlert,
          ...this.alerts.filter((currentAlert) => currentAlert.id !== savedAlert.id)
        ]);
        this.closeAlertModal();
      },
      error: (error: HttpErrorResponse) => {
        this.alertSaving = false;
        this.alertErrorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  getConfirmationRequiredLabel(value: boolean): string {
    return this.translate(value ? 'common.yes' : 'common.no');
  }

  getConfirmationSentDisplayValue(value?: string): string {
    if (!value?.trim()) {
      return this.translate('common.notAvailable');
    }

    switch (value.trim().toLowerCase()) {
      case 'yes':
        return this.translate('common.yes');
      case 'no':
        return this.translate('common.no');
      default:
        return this.translate('therapeuticPlan.alert.confirmationSent.na');
    }
  }

  private loadManageData(planId: number): void {
    forkJoin({
      plan: this.http.get<TherapeuticPlanManageResponse>(`${environment.apiBaseUrl}/therapeutic-plans/${planId}`),
      alerts: this.http.get<TherapeuticPlanAlert[]>(`${environment.apiBaseUrl}/therapeutic-plans/${planId}/alerts`).pipe(catchError(() => of([] as TherapeuticPlanAlert[]))),
      patients: this.http.get<TherapeuticPlanPatient[]>(`${environment.apiBaseUrl}/patients`).pipe(catchError(() => of([] as TherapeuticPlanPatient[]))),
      hospitals: this.structureApiService.getStructuresByType('HOSPITAL', true).pipe(catchError(() => of([] as StructureDto[]))),
      specialistClinics: this.structureApiService.getStructuresByType('SPECIALIST_CLINIC', true).pipe(catchError(() => of([] as StructureDto[]))),
      nurses: this.http.get<TherapeuticPlanNurse[]>(`${environment.apiBaseUrl}/nurses`).pipe(catchError(() => of([] as TherapeuticPlanNurse[]))),
      doctors: this.http.get<TherapeuticPlanDoctor[]>(`${environment.apiBaseUrl}/doctors`).pipe(catchError(() => of([] as TherapeuticPlanDoctor[]))),
      equipment: this.http.get<TherapeuticPlanEquipment[]>(`${environment.apiBaseUrl}/equipment`).pipe(catchError(() => of([] as TherapeuticPlanEquipment[])))
    }).subscribe({
      next: ({ plan, alerts, patients, hospitals, specialistClinics, nurses, doctors, equipment }) => {
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
        this.alerts = this.sortAlerts(alerts ?? []);
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

  private createEmptyAlertForm(): TherapeuticPlanAlertForm {
    return {
      date: this.getTodayDateInputValue(),
      subject: '',
      confirmationRequired: true,
      confirmationSent: 'no'
    };
  }

  private getTodayDateInputValue(): string {
    const today = new Date();
    const timezoneOffset = today.getTimezoneOffset() * 60_000;
    return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
  }

  private normalizeConfirmationSent(value?: string): 'yes' | 'no' | 'na' {
    switch (value?.trim().toLowerCase()) {
      case 'yes':
        return 'yes';
      case 'no':
        return 'no';
      default:
        return 'na';
    }
  }

  private sortAlerts(alerts: TherapeuticPlanAlert[]): TherapeuticPlanAlert[] {
    return [...alerts].sort((left, right) => {
      const leftDate = left.date ?? '';
      const rightDate = right.date ?? '';
      return rightDate.localeCompare(leftDate) || (right.id ?? 0) - (left.id ?? 0);
    });
  }
}