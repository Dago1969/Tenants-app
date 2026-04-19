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
  gender?: string; // M/F/Altro
  birthDate?: string; // ISO date
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

interface TherapeuticPlanNotification {
  id?: number;
  therapeuticPlanId: number;
  sentDate: string;
  sentByOperator?: string | null;
  subject: string;
  message: string;
  confirmed: boolean | null;
  confirmationDate?: string | null;
  confirmedByDoctor?: string | null;
  notes?: string | null;
}

interface TherapeuticPlanNotificationForm {
  sentDate: string;
  sentByOperator: string;
  subject: string;
  message: string;
  confirmedChoice: '' | 'yes' | 'no';
  confirmationDate: string;
  confirmedByDoctor: string;
  notes: string;
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
    /**
     * Calcola l'età del paziente dalla data di nascita (se disponibile), altrimenti mostra "Non disponibile".
     */
    get patientAge(): string {
      if (!this.patient || !(this.patient as any).birthDate) return this.translate('common.notAvailable');
      const birth = new Date((this.patient as any).birthDate);
      if (Number.isNaN(birth.getTime())) return this.translate('common.notAvailable');
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age.toString();
    }
  get patientGenderLabel(): string {
    if (!this.patient?.gender) return this.translate('common.notAvailable');
    switch ((this.patient.gender || '').toUpperCase()) {
      case 'M':
        return this.translate('patients.gender.male');
      case 'F':
        return this.translate('patients.gender.female');
      case 'ALTRO':
      case 'O':
        return this.translate('patients.gender.other');
      default:
        return this.patient.gender;
    }
  }

  get patientBirthDate(): string {
    if (!this.patient?.birthDate) return this.translate('common.notAvailable');
    return this.formatDate(this.patient.birthDate);
  }

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

  // Cartelle disponibili sotto il folder "Paziente"
  readonly patientFolders = [
    { key: 'followup', titleKey: 'therapeuticPlan.manage.patientFolder.followup' },
    { key: 'contatti', titleKey: 'therapeuticPlan.manage.patientFolder.contacts' },
    { key: 'visite', titleKey: 'therapeuticPlan.manage.patientFolder.visits' },
    { key: 'cartella-inf', titleKey: 'therapeuticPlan.manage.patientFolder.medicalRecord' },
    { key: 'storico-peg', titleKey: 'therapeuticPlan.manage.patientFolder.pegHistory' },
    { key: 'manutenzione', titleKey: 'therapeuticPlan.manage.patientFolder.maintenance' },
    { key: 'moduli', titleKey: 'therapeuticPlan.manage.patientFolder.modules' },
    { key: 'documenti', titleKey: 'therapeuticPlan.manage.patientFolder.documents' }
  ];

  // cartella attiva dentro il tab paziente
  activePatientFolder: string = 'followup';

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
  notifications: TherapeuticPlanNotification[] = [];
  notificationModalOpen = false;
  notificationSaving = false;
  notificationErrorMessage = '';
  editingNotificationId: number | null = null;
  notificationForm: TherapeuticPlanNotificationForm = this.createEmptyNotificationForm();
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

  setActivePatientFolder(folderKey: string): void {
    this.activePatientFolder = folderKey;
    // se l'utente seleziona "visite" come cartella, apriamo il tab visite
    if (folderKey === 'visite') {
      this.setActiveTab('visits');
    }
  }

  /**
   * Restituisce l'età del paziente alla data fornita (yyyy-mm-dd) oppure 'not available'.
   */
  getAgeAt(dateIso?: string): string {
    if (!this.patient || !(this.patient as any).birthDate || !dateIso) return this.translate('common.notAvailable');
    const birth = new Date((this.patient as any).birthDate);
    const when = new Date(dateIso);
    if (Number.isNaN(birth.getTime()) || Number.isNaN(when.getTime())) return this.translate('common.notAvailable');
    let age = when.getFullYear() - birth.getFullYear();
    const m = when.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && when.getDate() < birth.getDate())) age--;
    return String(age);
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

  get canCreateAlert(): boolean {
    return !!this.planId && !!this.plan?.doctorId;
  }

  get isEditingNotification(): boolean {
    return this.editingNotificationId !== null;
  }

  get notificationModalTitleKey(): MessageKey {
    return this.isEditingNotification
      ? 'therapeuticPlan.notification.modal.titleEdit'
      : 'therapeuticPlan.notification.modal.title';
  }

  get notificationSubmitLabelKey(): MessageKey {
    return this.isEditingNotification ? 'crud.actions.update' : 'crud.actions.create';
  }

  get notificationConfirmationSelected(): boolean {
    return this.notificationForm.confirmedChoice !== '';
  }

  get notificationNotesRequired(): boolean {
    return this.notificationForm.confirmedChoice === 'no';
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

  getConfirmedDisplayValue(value: boolean | null | undefined): string {
    if (value === true) {
      return this.translate('common.yes');
    }

    if (value === false) {
      return this.translate('common.no');
    }

    return this.translate('therapeuticPlan.notification.confirmed.pending');
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

  openNotificationModal(): void {
    if (!this.planId || this.notificationSaving) {
      return;
    }

    this.notificationErrorMessage = '';
    this.editingNotificationId = null;
    this.notificationForm = this.createEmptyNotificationForm();
    this.notificationModalOpen = true;
  }

  openNotificationEditModal(notification: TherapeuticPlanNotification): void {
    if (!this.planId || notification.id == null || this.notificationSaving) {
      return;
    }

    this.notificationErrorMessage = '';
    this.editingNotificationId = notification.id;
    this.notificationForm = {
      sentDate: notification.sentDate ?? '',
      sentByOperator: notification.sentByOperator?.trim() || this.getCurrentOperatorDisplayLabel(),
      subject: notification.subject ?? '',
      message: notification.message ?? '',
      confirmedChoice: this.normalizeConfirmedChoice(notification.confirmed),
      confirmationDate: notification.confirmationDate ?? '',
      confirmedByDoctor: notification.confirmedByDoctor ?? '',
      notes: notification.notes ?? ''
    };
    this.notificationModalOpen = true;
  }

  closeNotificationModal(): void {
    if (this.notificationSaving) {
      return;
    }

    this.notificationModalOpen = false;
    this.notificationErrorMessage = '';
    this.editingNotificationId = null;
    this.notificationForm = this.createEmptyNotificationForm();
  }

  onNotificationConfirmedChange(): void {
    if (!this.notificationConfirmationSelected) {
      this.notificationForm.confirmationDate = '';
      this.notificationForm.notes = '';
      return;
    }

    if (this.notificationForm.confirmedChoice === 'yes') {
      this.notificationForm.notes = '';
    }
  }

  saveNotification(): void {
    if (!this.planId || this.notificationSaving) {
      return;
    }

    this.notificationErrorMessage = '';
    if (!this.notificationForm.sentDate.trim()) {
      this.notificationErrorMessage = this.translate('therapeuticPlan.notification.validation.sentDateRequired');
      return;
    }
    if (!this.notificationForm.subject.trim()) {
      this.notificationErrorMessage = this.translate('therapeuticPlan.notification.validation.subjectRequired');
      return;
    }
    if (!this.notificationForm.message.trim()) {
      this.notificationErrorMessage = this.translate('therapeuticPlan.notification.validation.messageRequired');
      return;
    }
    if (this.notificationConfirmationSelected && !this.notificationForm.confirmationDate.trim()) {
      this.notificationErrorMessage = this.translate('therapeuticPlan.notification.validation.confirmationDateRequired');
      return;
    }
    if (this.notificationNotesRequired && !this.notificationForm.notes.trim()) {
      this.notificationErrorMessage = this.translate('therapeuticPlan.notification.validation.notesRequiredWhenRejected');
      return;
    }

    this.notificationSaving = true;
    const payload: TherapeuticPlanNotification = {
      therapeuticPlanId: this.planId,
      sentDate: this.notificationForm.sentDate,
      sentByOperator: this.notificationForm.sentByOperator.trim() || undefined,
      subject: this.notificationForm.subject.trim(),
      message: this.notificationForm.message.trim(),
      confirmed: this.notificationForm.confirmedChoice === '' ? null : this.notificationForm.confirmedChoice === 'yes',
      confirmationDate: this.notificationConfirmationSelected ? this.notificationForm.confirmationDate.trim() : null,
      notes: this.notificationForm.notes.trim() || null
    };

    const request = this.isEditingNotification && this.editingNotificationId !== null
      ? this.http.put<TherapeuticPlanNotification>(
          `${environment.apiBaseUrl}/therapeutic-plans/${this.planId}/notifications/${this.editingNotificationId}`,
          payload
        )
      : this.http.post<TherapeuticPlanNotification>(
          `${environment.apiBaseUrl}/therapeutic-plans/${this.planId}/notifications`,
          payload
        );

    request.subscribe({
      next: (savedNotification) => {
        this.notificationSaving = false;
        this.notifications = this.sortNotifications([
          savedNotification,
          ...this.notifications.filter((currentNotification) => currentNotification.id !== savedNotification.id)
        ]);
        this.closeNotificationModal();
      },
      error: (error: HttpErrorResponse) => {
        this.notificationSaving = false;
        this.notificationErrorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private loadManageData(planId: number): void {
    forkJoin({
      plan: this.http.get<TherapeuticPlanManageResponse>(`${environment.apiBaseUrl}/therapeutic-plans/${planId}`),
      notifications: this.http.get<TherapeuticPlanNotification[]>(`${environment.apiBaseUrl}/therapeutic-plans/${planId}/notifications`).pipe(catchError(() => of([] as TherapeuticPlanNotification[]))),
      alerts: this.http.get<TherapeuticPlanAlert[]>(`${environment.apiBaseUrl}/therapeutic-plans/${planId}/alerts`).pipe(catchError(() => of([] as TherapeuticPlanAlert[]))),
      patients: this.http.get<TherapeuticPlanPatient[]>(`${environment.apiBaseUrl}/patients`).pipe(catchError(() => of([] as TherapeuticPlanPatient[]))),
      hospitals: this.structureApiService.getStructuresByType('HOSPITAL', true).pipe(catchError(() => of([] as StructureDto[]))),
      specialistClinics: this.structureApiService.getStructuresByType('SPECIALIST_CLINIC', true).pipe(catchError(() => of([] as StructureDto[]))),
      nurses: this.http.get<TherapeuticPlanNurse[]>(`${environment.apiBaseUrl}/nurses`).pipe(catchError(() => of([] as TherapeuticPlanNurse[]))),
      doctors: this.http.get<TherapeuticPlanDoctor[]>(`${environment.apiBaseUrl}/doctors`).pipe(catchError(() => of([] as TherapeuticPlanDoctor[]))),
      equipment: this.http.get<TherapeuticPlanEquipment[]>(`${environment.apiBaseUrl}/equipment`).pipe(catchError(() => of([] as TherapeuticPlanEquipment[])))
    }).subscribe({
      next: ({ plan, notifications, alerts, patients, hospitals, specialistClinics, nurses, doctors, equipment }) => {
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
        this.notifications = this.sortNotifications(notifications ?? []);
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

  private createEmptyNotificationForm(): TherapeuticPlanNotificationForm {
    return {
      sentDate: this.getTodayDateInputValue(),
      sentByOperator: this.getCurrentOperatorDisplayLabel(),
      subject: '',
      message: '',
      confirmedChoice: '',
      confirmationDate: '',
      confirmedByDoctor: '',
      notes: ''
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

  private normalizeConfirmedChoice(value: boolean | null | undefined): '' | 'yes' | 'no' {
    if (value === true) {
      return 'yes';
    }

    if (value === false) {
      return 'no';
    }

    return '';
  }

  private getCurrentOperatorDisplayLabel(): string {
    return this.authService.getUsername()?.trim() || this.translate('common.notAvailable');
  }

  private sortNotifications(notifications: TherapeuticPlanNotification[]): TherapeuticPlanNotification[] {
    return [...notifications].sort((left, right) => {
      const leftDate = left.sentDate ?? '';
      const rightDate = right.sentDate ?? '';
      return rightDate.localeCompare(leftDate) || (right.id ?? 0) - (left.id ?? 0);
    });
  }

  private sortAlerts(alerts: TherapeuticPlanAlert[]): TherapeuticPlanAlert[] {
    return [...alerts].sort((left, right) => {
      const leftDate = left.date ?? '';
      const rightDate = right.date ?? '';
      return rightDate.localeCompare(leftDate) || (right.id ?? 0) - (left.id ?? 0);
    });
  }
}