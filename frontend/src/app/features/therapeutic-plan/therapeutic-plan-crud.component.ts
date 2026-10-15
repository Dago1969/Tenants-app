import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Select2 } from 'ng-select2-component';
import { forkJoin, of, firstValueFrom, Subject, timer } from 'rxjs';
import { catchError, distinctUntilChanged, finalize, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { DrugService, FarmacoDto } from '../../core/drug.service';
import { GeographyApiService, GeographicOptionDto } from '../../core/geography-api.service';
import { StructureApiService, StructureDepartmentOptionDto, StructureDto, StructureOverviewLookupDto } from '../../core/structure-api.service';
import { MessageKey, t } from '../../i18n/messages';
import { ConsentOtpFormComponent, ConsentOtpOption } from '../../shared/consent-otp-form.component';
import { QtmStepModalComponent } from '../../shared/qtm-step-modal.component';
import { QtmConsentWarningBadgeComponent } from 'qtm-shared';

interface PatientOption {
  id: number;
  consentRevoked?: boolean;
  assistedId?: string;
  firstName?: string;
  lastName?: string;
  primaryPhone?: string;
  caregiverPhone?: string;
  otpRecipient?: string;
}

interface NurseOption {
  id: number;
  fullName: string;
  enabled?: boolean;
  regionId?: number | null;
}

interface DoctorOption {
  id: number;
  fullName: string;
  specialization?: string;
  regionId?: number | null;
  structureId?: number | null;
  departmentId?: number | null;
}

interface TherapeuticPlanClinicalFilters {
  regionId: number | null;
  aslId: number | null;
  departmentId: number | null;
}

interface TherapeuticPlanProfessionalAssignment {
  professionalId: number;
  professionalName: string;
  priorityIndex: number;
}

interface TherapeuticPlanPayload {
  patientId: number | null;
  projectCode: string;
  equipmentIds: number[];
  hospitalId: number | null;
  departmentId?: number | null;
  nurseIds: number[];
  prevalentNurseId: number | null;
  nurseId?: number | null;
  doctorIds: number[];
  prevalentDoctorId: number | null;
  doctorId?: number | null;
  drugCode: string;
  drugDescription: string;
  startDate: string;
  endDate: string;
  dischargeDate?: string | null;
  dischargeType?: string | null;
  status: string;
  notes: string;
  surveyAnswers?: string;
  surveyAcceptanceToken?: string;
  surveyAcceptanceRecipient?: string;
}

interface TherapeuticPlanResponse extends Omit<TherapeuticPlanPayload, 'hospitalId'> {
  hospitalId?: number | null;
  structureId?: number | null;
  id?: number;
  nurseNames?: string[];
  doctorNames?: string[];
  nurseAssignments?: TherapeuticPlanProfessionalAssignment[];
  doctorAssignments?: TherapeuticPlanProfessionalAssignment[];
  jsonSurvey?: string | null;
  surveyAcceptedAt?: string | null;
}

interface WizardStep {
  key: 'main' | 'clinical' | 'schedule' | 'survey';
  title: MessageKey;
  description: MessageKey;
}

interface TherapeuticPlanSurveyChoice {
  value: string | number | boolean;
  text?: string;
}

interface TherapeuticPlanSurveyElement {
  type: string;
  name: string;
  title: string;
  isRequired?: boolean;
  choices?: TherapeuticPlanSurveyChoice[];
}

interface TherapeuticPlanSurveyPage {
  name?: string;
  title?: string;
  elements: TherapeuticPlanSurveyElement[];
}

interface TherapeuticPlanSurveyDefinition {
  pages: TherapeuticPlanSurveyPage[];
}

interface Select2Option {
  value: string;
  label: string;
  id: string;
}

interface Select2UpdatePayload {
  value: unknown;
}

/**
 * Wizard popup del piano terapeutico con selezione guidata dei riferimenti clinici.
 */
@Component({
  selector: 'app-therapeutic-plan-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, QtmStepModalComponent, Select2, ConsentOtpFormComponent, QtmConsentWarningBadgeComponent],
  templateUrl: './therapeutic-plan-crud.component.html',
  styleUrl: './therapeutic-plan-crud.component.css'
})
export class TherapeuticPlanCrudComponent implements OnInit {
  readonly titleKey = 'therapeuticPlan.title' as const;
  readonly steps: WizardStep[] = [
    { key: 'main', title: 'therapeuticPlan.folder.main', description: 'therapeuticPlan.folder.main.desc' },
    { key: 'clinical', title: 'therapeuticPlan.folder.clinical', description: 'therapeuticPlan.folder.clinical.desc' },
    { key: 'schedule', title: 'therapeuticPlan.folder.schedule', description: 'therapeuticPlan.folder.schedule.desc' },
    { key: 'survey', title: 'therapeuticPlan.folder.survey', description: 'therapeuticPlan.folder.survey.desc' }
  ];
  readonly statusOptions = [
    { value: 'draft', labelKey: 'status.draft' as const },
    { value: 'active', labelKey: 'status.active' as const },
    { value: 'completed', labelKey: 'status.completed' as const },
    { value: 'suspended', labelKey: 'status.suspended' as const },
    { value: 'cancelled', labelKey: 'status.cancelled' as const }
  ];

  loading = true;
  saving = false;
  errorMessage = '';
  currentStepIndex = 0;
  therapeuticPlanId: number | null = null;
  surveyAcceptedAt: string | null = null;
  surveyTemplate: TherapeuticPlanSurveyDefinition | null = null;
  surveyAnswers: Record<string, unknown> = {};
  private acceptedSurveyAnswersSignature: string | null = null;
  surveyOtpCode = '';
  surveyAcceptanceToken: string | null = null;
  surveyOtpChannel = 'sms';
  surveyOtpDestination = '';
  surveyOtpRecipient = '';
  surveyConsentDateTime = '';
  surveyOtpSent = false;
  surveyOtpVerified = false;
  sendingSurveyOtp = false;
  verifyingSurveyOtp = false;
  loadingSurvey = false;
  readonly surveyOtpChannels: ConsentOtpOption[] = [{ value: 'sms', label: 'SMS' }];

  get surveyAnswersChanged(): boolean {
    return this.acceptedSurveyAnswersSignature !== null
      && this.getSurveyAnswersSignature(this.surveyAnswers) !== this.acceptedSurveyAnswersSignature;
  }

  get surveyOtpRequired(): boolean {
    return !this.surveyAcceptedAt || this.surveyAnswersChanged;
  }

  get surveyOtpRecipientOptions(): ConsentOtpOption[] {
    const patient = this.patients.find((option) => option.id === this.formModel.patientId);
    if (!patient) {
      return [];
    }

    const options: ConsentOtpOption[] = [];
    if (patient.primaryPhone?.trim()) {
      options.push({
        value: 'primaryPhone',
        label: `${this.translate('therapeuticPlan.survey.otp.patientPhone')}: ${patient.primaryPhone.trim()}`
      });
    }
    if (patient.caregiverPhone?.trim()) {
      options.push({
        value: 'caregiverPhone',
        label: `${this.translate('therapeuticPlan.survey.otp.caregiverPhone')}: ${patient.caregiverPhone.trim()}`
      });
    }
    return options;
  }

  patients: PatientOption[] = [];
  regions: GeographicOptionDto[] = [];
  aslStructures: StructureDto[] = [];
  allAssociatedAslList: StructureDto[] = [];
  filteredAslList: StructureDto[] = [];
  departmentOptions: StructureDepartmentOptionDto[] = [];
  hospitals: StructureDto[] = [];
  aslOptions: StructureDto[] = [];
  hospitalsList: StructureDto[] = [];
  specialistClinics: StructureDto[] = [];
  nurses: NurseOption[] = [];
  doctors: DoctorOption[] = [];
  medicineOptions: FarmacoDto[] = [];
  medicineSearchQuery = '';
  medicineSearchLoading = false;
  clinicalFilters: TherapeuticPlanClinicalFilters = this.createEmptyClinicalFilters();
  clinicalRegionValue = '';
  clinicalAslValue = '';
  clinicalHospitalValue = '';
  regionSelect2Data: Select2Option[] = [];
  aslSelect2Data: Select2Option[] = [];
  hospitalSelect2Data: Select2Option[] = [];

  formModel: TherapeuticPlanPayload = this.createEmptyFormModel();
  private readonly medicineSearchTerms = new Subject<string>();

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly destroyRef: DestroyRef,
    private readonly geographyApiService: GeographyApiService,
    private readonly drugService: DrugService,
    private readonly structureApiService: StructureApiService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.therapeuticPlanId = idParam ? Number(idParam) : null;
    this.formModel.projectCode = this.authService.getSelectedProject().trim();
    this.connectMedicineSearch();
    this.loadReferenceData();
  }

  translate(key: MessageKey | string): string {
    try {
      return t(key as MessageKey);
    } catch {
      return key;
    }
  }

  private getCurrentDateTimeLocalInputValue(): string {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
  }

  get currentStep(): WizardStep {
    return this.visibleSteps[this.currentStepIndex] ?? this.visibleSteps[0];
  }

  get visibleSteps(): WizardStep[] {
    return this.steps;
  }

  get surveyElements(): TherapeuticPlanSurveyElement[] {
    return this.surveyTemplate?.pages.flatMap((page) => page.elements ?? []) ?? [];
  }

  get isEditMode(): boolean {
    return this.therapeuticPlanId !== null;
  }

  get selectedPatientLabel(): string {
    const patient = this.patients.find((p) => p.id === this.formModel.patientId) ?? null;
    return patient ? this.getPatientLabel(patient) : '';
  }

  get selectedPatientConsentRevoked(): boolean {
    return this.patients.some((patient) => patient.id === this.formModel.patientId && patient.consentRevoked === true);
  }

  get isFirstStep(): boolean {
    return this.currentStepIndex === 0;
  }

  get isLastStep(): boolean {
    return this.currentStepIndex === this.visibleSteps.length - 1;
  }

  get selectedHospital(): StructureDto | null {
    return this.availableHospitals.find((hospital) => this.normalizeNumericId(hospital.id) === this.formModel.hospitalId) ?? null;
  }

  get availableHospitals(): StructureDto[] {
    const selectedAsl = this.selectedAsl;
    const visibleHospitals = this.hospitals.filter((hospital) => {
      if (!this.matchesSelectedRegion(hospital)) {
        return false;
      }

      if (this.clinicalFilters.aslId === null) {
        return true;
      }

      const parentHospitalId = this.normalizeNumericId(hospital.parentStructureId);
      if (parentHospitalId !== null) {
        return parentHospitalId === this.clinicalFilters.aslId;
      }

      const selectedAslName = selectedAsl?.name?.trim().toLocaleLowerCase('it') ?? '';
      const parentHospitalName = hospital.parentStructureName?.trim().toLocaleLowerCase('it') ?? '';
      return !!selectedAslName && selectedAslName === parentHospitalName;
    });

    const visibleSpecialistClinics = this.specialistClinics.filter((hospital) => {
      return this.matchesSelectedRegion(hospital);
    });

    return [...visibleHospitals, ...visibleSpecialistClinics].sort((left, right) => this.getStructureLabel(left).localeCompare(this.getStructureLabel(right), 'it', { sensitivity: 'base' }));
  }

  get selectedAsl(): StructureDto | null {
    return this.aslStructures.find((structure) => this.normalizeNumericId(structure.id) === this.clinicalFilters.aslId) ?? null;
  }

  get availableAslStructures(): StructureDto[] {
    return this.filteredAslList;
  }

  get availableNurses(): NurseOption[] {
    if (this.clinicalFilters.regionId === null) {
      return this.nurses;
    }

    return this.nurses.filter((nurse) => this.normalizeNumericId(nurse.regionId) === this.clinicalFilters.regionId);
  }

  get availableDoctors(): DoctorOption[] {
    return this.doctors;
  }

  get selectedNurses(): NurseOption[] {
    return this.formModel.nurseIds
      .map((nurseId) => this.nurses.find((nurse) => nurse.id === nurseId) ?? null)
      .filter((nurse): nurse is NurseOption => nurse !== null);
  }

  get selectedDoctors(): DoctorOption[] {
    return this.formModel.doctorIds
      .map((doctorId) => this.doctors.find((doctor) => doctor.id === doctorId) ?? null)
      .filter((doctor): doctor is DoctorOption => doctor !== null);
  }

  onMedicineSearchChange(query: string): void {
    this.medicineSearchQuery = query;
    if (query !== this.formModel.drugDescription) {
      this.formModel.drugCode = '';
      this.formModel.drugDescription = '';
    }
    this.medicineSearchTerms.next(query.trim());
  }

  selectMedicine(medicine: FarmacoDto): void {
    this.formModel.drugCode = medicine.aicCode;
    this.formModel.drugDescription = this.formatMedicine(medicine);
    this.medicineSearchQuery = this.formModel.drugDescription;
    this.medicineOptions = [];
  }

  formatMedicine(medicine: FarmacoDto): string {
    const nameAndIngredient = [medicine.tradeName, medicine.activeIngredient]
      .filter((value) => !!value?.trim())
      .join(' - ');
    const name = nameAndIngredient || medicine.aicCode;
    return medicine.dosage?.trim() ? `${name} (${medicine.dosage.trim()})` : name;
  }

  private connectMedicineSearch(): void {
    this.medicineSearchTerms.pipe(
      distinctUntilChanged(),
      switchMap((query) => {
        if (query.length < 3) {
          this.medicineSearchLoading = false;
          this.medicineOptions = [];
          return of([] as FarmacoDto[]);
        }

        this.medicineSearchLoading = true;
        return timer(300).pipe(
          switchMap(() => this.drugService.searchDrugs(query).pipe(catchError(() => of([] as FarmacoDto[])))),
          finalize(() => this.medicineSearchLoading = false)
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((medicines) => this.medicineOptions = medicines);
  }

  onClinicalRegionChange(): void {
    this.clearCascadeSelectionsAfterRegionChange();
    this.syncClinicalFilterSelect2Values();
    this.refreshClinicalSelect2Data();

    const regionCode = this.getNormalizedRegionCode(this.clinicalFilters.regionId);
    if (!regionCode) {
      this.loadAvailableDoctors();
      return;
    }

    this.loadHospitalStructures();
    this.loadAvailableDoctors();
  }

  onRegionSelect2Update(event: Select2UpdatePayload): void {
    this.clinicalRegionValue = this.normalizeSelect2Value(this.extractSingleValue(event.value));
    this.clinicalFilters.regionId = this.toNullableNumber(this.clinicalRegionValue);
    this.onClinicalRegionChange();
  }

  onClinicalAslChange(): void {
    this.formModel.hospitalId = null;
    this.clearDepartmentSelection();
    this.hospitals = [];
    this.hospitalsList = [];

    this.syncClinicalFilterSelect2Values();
    this.refreshClinicalSelect2Data();

    const regionCode = this.getNormalizedRegionCode(this.clinicalFilters.regionId);
    if (!regionCode) {
      this.loadAvailableDoctors();
      return;
    }

    this.loadHospitalStructures();
    this.loadAvailableDoctors();
  }

  onAslSelect2Update(event: Select2UpdatePayload): void {
    this.clinicalAslValue = this.normalizeSelect2Value(this.extractSingleValue(event.value));
    this.clinicalFilters.aslId = this.toNullableNumber(this.clinicalAslValue);
    this.onClinicalAslChange();
  }

  private clearCascadeSelectionsAfterRegionChange(): void {
    this.clinicalFilters.aslId = null;
    this.clinicalAslValue = '';
    this.formModel.hospitalId = null;
    this.clearDepartmentSelection();
    this.aslStructures = [];
    this.hospitals = [];
    this.aslOptions = [];
    this.hospitalsList = [];
  }

  onHospitalChange(): void {
    this.clearDepartmentSelection();

    const selectedHospital = this.selectedHospital;
    if (!selectedHospital) {
      this.syncClinicalSelections();
      this.loadAvailableDoctors();
      return;
    }

    this.clinicalFilters.regionId = this.normalizeNumericId(selectedHospital.regionId);
    this.clinicalFilters.aslId = this.normalizeNumericId(selectedHospital.parentStructureId);
    this.formModel.hospitalId = this.normalizeNumericId(selectedHospital.id);
    this.loadDepartmentsForSelectedHospital();
    this.loadAvailableDoctors();
  }

  onHospitalSelect2Update(event: Select2UpdatePayload): void {
    this.clinicalHospitalValue = this.normalizeSelect2Value(this.extractSingleValue(event.value));
    this.formModel.hospitalId = this.toNullableNumber(this.clinicalHospitalValue);
    this.onHospitalChange();
  }

  onDepartmentFilterChange(): void {
    this.formModel.departmentId = this.clinicalFilters.departmentId;
    this.loadAvailableDoctors();
  }

  previousStep(): void {
    if (!this.isFirstStep) {
      this.currentStepIndex -= 1;
    }
  }

  nextStep(): void {
    if (!this.canLeaveCurrentStep() || this.isLastStep) {
      return;
    }

    const nextStep = this.visibleSteps[this.currentStepIndex + 1];
    if (nextStep?.key === 'survey' && !this.surveyTemplate) {
      this.loadSurveyTemplate();
      return;
    }

    this.currentStepIndex += 1;
  }

  sendSurveyOtp(): void {
    if (!this.formModel.patientId || !this.surveyOtpRecipient || this.sendingSurveyOtp) {
      return;
    }

    this.errorMessage = '';
    this.sendingSurveyOtp = true;
    const params: Record<string, string> = {
      patientId: String(this.formModel.patientId),
      recipient: this.surveyOtpRecipient
    };
    if (this.therapeuticPlanId !== null) {
      params['therapeuticPlanId'] = String(this.therapeuticPlanId);
    }

    this.http.post<{ destination: string; channel: string }>(`${environment.apiBaseUrl}/therapeutic-plans/survey/otp`, {}, { params }).subscribe({
      next: (result) => {
        this.sendingSurveyOtp = false;
        this.surveyOtpSent = true;
        this.surveyOtpVerified = false;
          this.surveyAcceptanceToken = null;
        this.surveyOtpDestination = result.destination;
        this.surveyOtpChannel = result.channel || 'sms';
        this.surveyConsentDateTime = '';
      },
      error: (error: HttpErrorResponse) => {
        this.sendingSurveyOtp = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  verifySurveyOtp(): void {
    if (!this.formModel.patientId || !this.surveyOtpRecipient || !this.surveyOtpCode.trim() || this.verifyingSurveyOtp) {
      return;
    }

    this.errorMessage = '';
    this.verifyingSurveyOtp = true;
    const params: Record<string, string> = {
      patientId: String(this.formModel.patientId),
      recipient: this.surveyOtpRecipient,
      code: this.surveyOtpCode.trim()
    };
    if (this.therapeuticPlanId !== null) {
      params['therapeuticPlanId'] = String(this.therapeuticPlanId);
    }

    this.http.post<{ approved: boolean; destination: string; channel: string; token: string | null }>(
      `${environment.apiBaseUrl}/therapeutic-plans/survey/otp/check`,
      {},
      { params }
    ).subscribe({
      next: (result) => {
        this.verifyingSurveyOtp = false;
        if (!result.approved) {
          this.surveyOtpVerified = false;
          this.surveyAcceptanceToken = null;
          this.surveyConsentDateTime = '';
          this.errorMessage = this.translate('therapeuticPlan.survey.error.otpRejected');
          return;
        }
        if (!result.token) {
          this.surveyOtpVerified = false;
          this.surveyAcceptanceToken = null;
          this.surveyConsentDateTime = '';
          this.errorMessage = this.translate('therapeuticPlan.survey.error.otpRejected');
          return;
        }
        this.surveyOtpVerified = true;
        this.surveyAcceptanceToken = result.token;
        this.surveyOtpDestination = result.destination || this.surveyOtpDestination;
        this.surveyOtpChannel = result.channel || this.surveyOtpChannel;
        this.surveyConsentDateTime = this.getCurrentDateTimeLocalInputValue();
      },
      error: (error: HttpErrorResponse) => {
        this.verifyingSurveyOtp = false;
        this.surveyOtpVerified = false;
        this.surveyConsentDateTime = '';
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  onSurveyAnswerChange(name: string, answer: unknown): void {
    this.surveyAnswers[name] = answer;
    if (this.surveyOtpRequired) {
      this.surveyOtpCode = '';
      this.surveyOtpSent = false;
      this.surveyOtpVerified = false;
      this.surveyAcceptanceToken = null;
      this.surveyConsentDateTime = '';
      return;
    }

    this.surveyOtpVerified = true;
    this.surveyOtpCode = '';
    this.surveyOtpSent = false;
    this.surveyAcceptanceToken = null;
    this.surveyConsentDateTime = this.surveyAcceptedAt
      ? this.toDateTimeLocalValue(this.surveyAcceptedAt)
      : '';
  }

  /**
   * Gestisce il cambio di selezione infermieri da ng-select
   */
  onNurseSelectionChange(selectedIds: number[]): void {
    const removedIds = this.formModel.nurseIds.filter(id => !selectedIds.includes(id));
    const addedIds = selectedIds.filter(id => !this.formModel.nurseIds.includes(id));

    // Se rimosso infermiere prevalente, imposta il primo della nuova lista
    if (removedIds.includes(this.formModel.prevalentNurseId ?? -1)) {
      this.formModel.prevalentNurseId = selectedIds[0] ?? null;
    }

    // Se aggiunto il primo infermiere, impostalo come prevalente
    if (addedIds.length > 0 && this.formModel.prevalentNurseId === null) {
      this.formModel.prevalentNurseId = addedIds[0] ?? null;
    }

    this.formModel.nurseIds = selectedIds;
  }

  /**
   * Gestisce il cambio di selezione dottori da ng-select
   */
  onDoctorSelectionChange(selectedIds: number[]): void {
    const removedIds = this.formModel.doctorIds.filter(id => !selectedIds.includes(id));
    const addedIds = selectedIds.filter(id => !this.formModel.doctorIds.includes(id));

    // Se rimosso dottore prevalente, imposta il primo della nuova lista
    if (removedIds.includes(this.formModel.prevalentDoctorId ?? -1)) {
      this.formModel.prevalentDoctorId = selectedIds[0] ?? null;
    }

    // Se aggiunto il primo dottore, impostalo come prevalente
    if (addedIds.length > 0 && this.formModel.prevalentDoctorId === null) {
      this.formModel.prevalentDoctorId = addedIds[0] ?? null;
    }

    this.formModel.doctorIds = selectedIds;
  }

  toggleNurseSelection(nurseId: number): void {
    if (this.formModel.nurseIds.includes(nurseId)) {
      this.formModel.nurseIds = this.formModel.nurseIds.filter((currentNurseId) => currentNurseId !== nurseId);
      if (this.formModel.prevalentNurseId === nurseId) {
        this.formModel.prevalentNurseId = this.formModel.nurseIds[0] ?? null;
      }
      return;
    }

    this.formModel.nurseIds = [...this.formModel.nurseIds, nurseId];
    if (this.formModel.prevalentNurseId === null) {
      this.setPrevalentNurse(nurseId);
    }
  }

  toggleDoctorSelection(doctorId: number): void {
    if (this.formModel.doctorIds.includes(doctorId)) {
      this.formModel.doctorIds = this.formModel.doctorIds.filter((currentDoctorId) => currentDoctorId !== doctorId);
      if (this.formModel.prevalentDoctorId === doctorId) {
        this.formModel.prevalentDoctorId = this.formModel.doctorIds[0] ?? null;
      }
      return;
    }

    this.formModel.doctorIds = [...this.formModel.doctorIds, doctorId];
    if (this.formModel.prevalentDoctorId === null) {
      this.setPrevalentDoctor(doctorId);
    }
  }

  setPrevalentNurse(nurseId: number): void {
    if (!this.formModel.nurseIds.includes(nurseId)) {
      return;
    }

    this.formModel.prevalentNurseId = nurseId;
    this.formModel.nurseIds = this.reorderWithPrevalentFirst(this.formModel.nurseIds, nurseId);
  }

  setPrevalentDoctor(doctorId: number): void {
    if (!this.formModel.doctorIds.includes(doctorId)) {
      return;
    }

    this.formModel.prevalentDoctorId = doctorId;
    this.formModel.doctorIds = this.reorderWithPrevalentFirst(this.formModel.doctorIds, doctorId);
  }

  isPrevalentNurse(nurseId: number): boolean {
    return this.formModel.prevalentNurseId === nurseId;
  }

  isPrevalentDoctor(doctorId: number): boolean {
    return this.formModel.prevalentDoctorId === doctorId;
  }

  save(): void {
    this.errorMessage = '';
    if (!this.canLeaveCurrentStep() || this.saving) {
      return;
    }

    this.saving = true;
    const payload = this.buildPayload();
    const request = this.therapeuticPlanId === null
      ? this.http.post(`${environment.apiBaseUrl}/therapeutic-plans`, payload)
      : this.http.put(`${environment.apiBaseUrl}/therapeutic-plans/${this.therapeuticPlanId}`, payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.close();
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  cancel(): void {
    this.close();
  }

  getPatientLabel(patient: PatientOption): string {
    const fullName = `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim();
    return patient.assistedId?.trim() ? `${fullName} (${patient.assistedId.trim()})` : fullName;
  }


  getStructureLabel(structure: StructureDto): string {
    return structure.selectionLabel?.trim().length ? structure.selectionLabel : structure.name;
  }

  private getAslLabel(row: StructureOverviewLookupDto, aslCode: string): string {
    const aslName = [row.asl, row.denominazioneAzienda, row.aslName, row.aslDescription]
      .find((value) => typeof value === 'string' && value.trim().length)?.trim();
    return aslName ? `${aslName} (${aslCode})` : aslCode;
  }

  private loadReferenceData(): void {
    forkJoin({
      regions: this.geographyApiService.getRegions().pipe(catchError(() => of([] as GeographicOptionDto[]))),
      patients: this.http.get<PatientOption[]>(`${environment.apiBaseUrl}/patients`).pipe(catchError(() => of([] as PatientOption[]))),
      specialistClinics: this.structureApiService.getStructuresByType('SPECIALIST_CLINIC', true).pipe(catchError(() => of([] as StructureDto[]))),
      nurses: this.http.get<NurseOption[]>(`${environment.apiBaseUrl}/nurses`).pipe(catchError(() => of([] as NurseOption[])))
    }).subscribe({
      next: ({ regions, patients, specialistClinics, nurses }) => {
        this.regions = [...regions].sort((left, right) => left.name.localeCompare(right.name, 'it', { sensitivity: 'base' }));
        this.patients = [...patients].sort((left, right) => this.getPatientLabel(left).localeCompare(this.getPatientLabel(right), 'it', { sensitivity: 'base' }));
        this.initializeSurveyOtpRecipient();
        this.specialistClinics = [...specialistClinics].sort((left, right) => this.getStructureLabel(left).localeCompare(this.getStructureLabel(right), 'it', { sensitivity: 'base' }));
        this.nurses = [...nurses]
          .filter((nurse) => nurse.enabled !== false)
          .sort((left, right) => left.fullName.localeCompare(right.fullName, 'it', { sensitivity: 'base' }));
        this.refreshClinicalSelect2Data();

        if (this.therapeuticPlanId === null) {
          this.loadHospitalStructures();
          this.loadAvailableDoctors();
          this.syncClinicalFilterSelect2Values();
          this.loading = false;
          return;
        }

        this.loadTherapeuticPlan();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private loadTherapeuticPlan(): void {
    this.http.get<TherapeuticPlanResponse>(`${environment.apiBaseUrl}/therapeutic-plans/${this.therapeuticPlanId}`).subscribe({
      next: (plan) => {
        this.surveyAcceptedAt = plan.surveyAcceptedAt ?? null;
        this.surveyAnswers = this.parseSurveyAnswers(plan.surveyAnswers);
        this.acceptedSurveyAnswersSignature = this.surveyAcceptedAt
          ? this.getSurveyAnswersSignature(this.surveyAnswers)
          : null;
        this.surveyOtpVerified = Boolean(this.surveyAcceptedAt);
        this.surveyConsentDateTime = this.surveyAcceptedAt ? this.toDateTimeLocalValue(this.surveyAcceptedAt) : '';
        const loadedDepartmentId = typeof plan.departmentId === 'number' ? plan.departmentId : null;
        this.formModel = {
          patientId: typeof plan.patientId === 'number' ? plan.patientId : null,
          projectCode: typeof plan.projectCode === 'string' && plan.projectCode.trim().length ? plan.projectCode : this.authService.getSelectedProject().trim(),
          equipmentIds: Array.isArray(plan.equipmentIds) ? plan.equipmentIds.filter((currentId): currentId is number => typeof currentId === 'number') : [],
          hospitalId: typeof plan.hospitalId === 'number'
            ? plan.hospitalId
            : typeof plan.structureId === 'number' ? plan.structureId : null,
          departmentId: loadedDepartmentId,
          nurseIds: this.normalizeLoadedProfessionalIds(plan.nurseIds, plan.prevalentNurseId, plan.nurseId),
          prevalentNurseId: this.resolveLoadedPrevalentId(plan.nurseIds, plan.prevalentNurseId, plan.nurseId),
          nurseId: typeof plan.nurseId === 'number' ? plan.nurseId : null,
          doctorIds: this.normalizeLoadedProfessionalIds(plan.doctorIds, plan.prevalentDoctorId, plan.doctorId),
          prevalentDoctorId: this.resolveLoadedPrevalentId(plan.doctorIds, plan.prevalentDoctorId, plan.doctorId),
          doctorId: typeof plan.doctorId === 'number' ? plan.doctorId : null,
          drugCode: typeof plan.drugCode === 'string' ? plan.drugCode : '',
          drugDescription: typeof plan.drugDescription === 'string' ? plan.drugDescription : '',
          startDate: typeof plan.startDate === 'string' ? plan.startDate : '',
          endDate: typeof plan.endDate === 'string' ? plan.endDate : '',
          dischargeDate: typeof plan.dischargeDate === 'string' ? plan.dischargeDate : '',
          dischargeType: typeof plan.dischargeType === 'string' ? plan.dischargeType : null,
          status: typeof plan.status === 'string' ? plan.status : 'draft',
          notes: typeof plan.notes === 'string' ? plan.notes : ''
        };
        this.initializeSurveyOtpRecipient();
        this.medicineSearchQuery = this.formModel.drugDescription || this.formModel.drugCode;
        if (loadedDepartmentId !== null) {
          this.clinicalFilters.departmentId = loadedDepartmentId;
        }
        this.initializeClinicalFiltersFromFormModel();
        // nessun caricamento selezione farmaco custom
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private canLeaveCurrentStep(): boolean {
    this.errorMessage = '';

    if (this.currentStep.key === 'main') {
      if (!this.formModel.patientId) {
        this.errorMessage = this.translate('therapeuticPlan.validation.patientRequired');
        return false;
      }
      if (!this.formModel.projectCode.trim()) {
        this.errorMessage = this.translate('therapeuticPlan.validation.projectRequired');
        return false;
      }
      if (!this.formModel.drugCode.trim()) {
        this.errorMessage = this.translate('therapeuticPlan.validation.medicineRequired');
        return false;
      }
      if (!this.formModel.status.trim()) {
        this.errorMessage = this.translate('therapeuticPlan.validation.statusRequired');
        return false;
      }
    }

    if (this.currentStep.key === 'clinical') {
      if (!this.formModel.hospitalId) {
        this.errorMessage = this.translate('therapeuticPlan.validation.structureRequired');
        return false;
      }
      if (this.formModel.nurseIds.length === 0 || this.formModel.prevalentNurseId === null) {
        this.errorMessage = this.translate('therapeuticPlan.validation.nurseRequired');
        return false;
      }
      if (this.formModel.doctorIds.length === 0 || this.formModel.prevalentDoctorId === null) {
        this.errorMessage = this.translate('therapeuticPlan.validation.doctorRequired');
        return false;
      }
    }

    if (this.currentStep.key === 'schedule') {
      if (!this.formModel.startDate) {
        this.errorMessage = this.translate('therapeuticPlan.validation.startDateRequired');
        return false;
      }
      if (this.formModel.endDate && this.formModel.endDate < this.formModel.startDate) {
        this.errorMessage = this.translate('therapeuticPlan.validation.endDateAfterStartDate');
        return false;
      }
    }

    if (this.currentStep.key === 'survey' && this.surveyOtpRequired) {
      if (this.surveyElements.length === 0) {
        this.errorMessage = this.translate('therapeuticPlan.survey.error.noQuestions');
        return false;
      }
      const missingRequiredAnswer = this.surveyElements.some((element) => {
        const answer = this.surveyAnswers[element.name];
        return element.isRequired && (answer === undefined || answer === null || answer === '');
      });
      if (missingRequiredAnswer) {
        this.errorMessage = this.translate('therapeuticPlan.survey.error.requiredAnswers');
        return false;
      }
      if (!this.surveyOtpSent || !this.surveyOtpVerified || !this.surveyAcceptanceToken) {
        this.errorMessage = this.translate('therapeuticPlan.survey.error.otpRequired');
        return false;
      }
    }

    return true;
  }

  private loadSurveyTemplate(): void {
    this.loadingSurvey = true;
    this.errorMessage = '';
    this.http.get(`${environment.apiBaseUrl}/therapeutic-plans/survey`, {
      params: { projectCode: this.formModel.projectCode.trim() },
      responseType: 'text'
    }).subscribe({
      next: (jsonSurvey) => {
        try {
          const parsed = JSON.parse(jsonSurvey) as TherapeuticPlanSurveyDefinition;
          if (!Array.isArray(parsed?.pages)) {
            throw new Error('Invalid survey format');
          }
          this.surveyTemplate = parsed;
          if (!this.surveyAcceptedAt) {
            this.surveyAnswers = {};
            this.surveyOtpCode = '';
            this.surveyOtpDestination = '';
            this.initializeSurveyOtpRecipient();
            this.surveyConsentDateTime = '';
            this.surveyOtpSent = false;
            this.surveyOtpVerified = false;
          }
          this.currentStepIndex += 1;
        } catch {
          this.errorMessage = this.translate('therapeuticPlan.survey.error.invalidTemplate');
        } finally {
          this.loadingSurvey = false;
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loadingSurvey = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private buildPayload(): TherapeuticPlanPayload {
    const selectedDepartmentId = this.clinicalFilters.departmentId ?? this.formModel.departmentId ?? null;
    const payload: TherapeuticPlanPayload = {
      patientId: this.formModel.patientId,
      projectCode: this.formModel.projectCode.trim(),
      equipmentIds: [...this.formModel.equipmentIds],
      hospitalId: this.formModel.hospitalId,
      departmentId: selectedDepartmentId,
      nurseIds: [...this.formModel.nurseIds],
      prevalentNurseId: this.formModel.prevalentNurseId,
      nurseId: this.formModel.prevalentNurseId,
      doctorIds: [...this.formModel.doctorIds],
      prevalentDoctorId: this.formModel.prevalentDoctorId,
      doctorId: this.formModel.prevalentDoctorId,
      drugCode: this.formModel.drugCode.trim(),
      drugDescription: this.formModel.drugDescription.trim(),
      startDate: this.formModel.startDate,
      endDate: this.formModel.endDate,
      dischargeDate: this.formModel.dischargeDate || null,
      dischargeType: this.formModel.dischargeType || null,
      status: this.formModel.status,
      notes: this.formModel.notes.trim()
    };

    if (this.surveyTemplate) {
      payload.surveyAnswers = JSON.stringify(this.surveyAnswers);
    }

    if (this.surveyOtpRequired) {
      payload.surveyAcceptanceToken = this.surveyAcceptanceToken ?? undefined;
      payload.surveyAcceptanceRecipient = this.surveyOtpRecipient;
    }

    return payload;
  }

  private parseSurveyAnswers(value?: string): Record<string, unknown> {
    if (!value) {
      return {};
    }

    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {};
    } catch {
      return {};
    }
  }

  private getSurveyAnswersSignature(answers: Record<string, unknown>): string {
    return JSON.stringify(Object.keys(answers).sort().map((key) => [key, answers[key]]));
  }

  private toDateTimeLocalValue(value: string): string {
    return value.length >= 16 ? value.slice(0, 16) : value;
  }

  onSurveyOtpRecipientChange(recipient: string): void {
    this.surveyOtpRecipient = recipient;
    this.surveyOtpCode = '';
    this.surveyOtpDestination = '';
    this.surveyOtpSent = false;
    this.surveyOtpVerified = false;
    this.surveyAcceptanceToken = null;
    this.surveyConsentDateTime = '';
  }

  private initializeSurveyOtpRecipient(): void {
    const options = this.surveyOtpRecipientOptions;
    if (options.some((option) => option.value === this.surveyOtpRecipient)) {
      return;
    }

    const patient = this.patients.find((option) => option.id === this.formModel.patientId);
    const preferredRecipient = patient?.otpRecipient?.trim();
    this.surveyOtpRecipient = options.some((option) => option.value === preferredRecipient)
      ? preferredRecipient!
      : options[0]?.value ?? '';
  }

  private createEmptyClinicalFilters(): TherapeuticPlanClinicalFilters {
    return {
      regionId: null,
      aslId: null,
      departmentId: null
    };
  }

  private createEmptyFormModel(): TherapeuticPlanPayload {
    return {
      patientId: null,
      projectCode: '',
      equipmentIds: [],
      hospitalId: null,
      departmentId: null,
      nurseIds: [],
      prevalentNurseId: null,
      nurseId: null,
      doctorIds: [],
      prevalentDoctorId: null,
      doctorId: null,
      drugCode: '',
      drugDescription: '',
      startDate: '',
      endDate: '',
      dischargeDate: '',
      dischargeType: null,
      status: 'draft',
      notes: ''
    };
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

  private normalizeLoadedProfessionalIds(
    ids: number[] | undefined,
    prevalentId: number | null | undefined,
    legacyId: number | null | undefined
  ): number[] {
    const normalizedIds = Array.isArray(ids)
      ? ids.filter((currentId): currentId is number => typeof currentId === 'number')
      : [];
    const fallbackId = typeof legacyId === 'number' ? legacyId : null;
    const resolvedPrevalentId = typeof prevalentId === 'number' ? prevalentId : fallbackId;

    if (fallbackId !== null && !normalizedIds.includes(fallbackId)) {
      normalizedIds.push(fallbackId);
    }

    return resolvedPrevalentId === null ? normalizedIds : this.reorderWithPrevalentFirst(normalizedIds, resolvedPrevalentId);
  }

  private resolveLoadedPrevalentId(
    ids: number[] | undefined,
    prevalentId: number | null | undefined,
    legacyId: number | null | undefined
  ): number | null {
    if (typeof prevalentId === 'number') {
      return prevalentId;
    }
    if (typeof legacyId === 'number') {
      return legacyId;
    }

    const normalizedIds = Array.isArray(ids)
      ? ids.filter((currentId): currentId is number => typeof currentId === 'number')
      : [];
    return normalizedIds[0] ?? null;
  }

  private initializeClinicalFiltersFromFormModel(): void {
    const hospitalId = this.formModel.hospitalId;
    if (hospitalId === null) {
      this.clinicalFilters = this.createEmptyClinicalFilters();
      this.clearDepartmentSelection();
      this.syncClinicalSelections();
      return;
    }

    const selectedHospital = this.findKnownHospitalById(hospitalId);
    if (selectedHospital) {
      const savedDept = (this.formModel as any).departmentId ?? null;
      void this.applyClinicalFiltersFromHospital(selectedHospital, savedDept);
      return;
    }

    // Try to resolve the structure via the overview endpoint (avoid calling /structures/{id} which sometimes 404s)
    const params: Record<string, string> = {};
    params['hospitalId'] = String(hospitalId);
    this.http.get<any[]>(`${environment.apiBaseUrl}/hospitals/overview`, { params }).pipe(
      catchError(() => of([] as any[]))
    ).subscribe(async (overviewRows) => {
      const matched = (overviewRows ?? []).find((row) => this.normalizeNumericId(row['hospitalId'] ?? row['strutturaId']) === hospitalId) ?? null;
      if (!matched) {
        this.clinicalFilters = this.createEmptyClinicalFilters();
        this.clearDepartmentSelection();
        this.syncClinicalSelections();
        return;
      }

      // Build a minimal StructureDto from overview row and apply filters
      const structureDto: StructureDto = {
        id: this.normalizeNumericId(matched['hospitalId'] ?? matched['strutturaId']) ?? undefined,
        code: this.normalizeCodeValue(matched['hospitalCode'] ?? matched['codiceStruttura']),
        name: (matched['struttura'] ?? '').trim() || this.normalizeCodeValue(matched['hospitalCode'] ?? matched['codiceStruttura']),
        selectionLabel: (matched['struttura'] ?? '').trim().length ? `${(matched['struttura'] ?? '').trim()} (${this.normalizeCodeValue(matched['hospitalCode'] ?? matched['codiceStruttura'])})` : this.normalizeCodeValue(matched['hospitalCode'] ?? matched['codiceStruttura']),
        address: '',
        cap: '',
        provinceId: '',
        regionId: this.normalizeCodeValue(matched['codiceRegione']) ? (this.normalizeNumericId(matched['codiceRegione']) ?? this.normalizeCodeValue(matched['codiceRegione'])) : '',
        region: (matched['regione'] ?? '').trim(),
        phone: '',
        referents: [],
        structureType: 'HOSPITAL',
        active: true,
        parentStructureId: this.normalizeNumericId(matched['aslId']) ?? undefined,
        parentStructureName: (matched['asl'] ?? '').trim() || undefined
      };

      const savedDept = (this.formModel as any).departmentId ?? null;
      const regionCode = this.normalizeCodeValue(matched['codiceRegione']);
      const aslCode = this.normalizeCodeValue(matched['codiceAsl']);
      const overviewHospitalId = this.normalizeNumericId(matched['hospitalId'] ?? matched['strutturaId']);
      await this.applyClinicalFiltersFromHospital(structureDto, savedDept, regionCode, aslCode, this.normalizeNumericId(matched['aslId']) ?? undefined, overviewHospitalId ?? undefined);
    });
  }

  private async applyClinicalFiltersFromHospital(
    selectedHospital: StructureDto,
    initialDepartmentId: number | null = null,
    overviewRegionCode?: string,
    overviewAslCode?: string,
    overviewAslId?: number | undefined,
    overviewStrutturaId?: number | undefined
  ): Promise<void> {
    const matchedAsl = this.resolveAslForStructure(selectedHospital);

    this.clinicalFilters = {
      regionId: this.normalizeNumericId(selectedHospital.regionId),
      aslId: matchedAsl?.id ?? this.normalizeNumericId(selectedHospital.parentStructureId),
      departmentId: initialDepartmentId ?? null
    };

    // Ensure clinicalFilters.regionId/aslId are set so we can fetch lists
    if (overviewRegionCode !== undefined) {
      const regionNumeric = this.normalizeNumericId(overviewRegionCode);
      if (regionNumeric !== null) {
        this.clinicalFilters.regionId = regionNumeric;
      }
    }
    if (overviewAslId !== undefined) {
      this.clinicalFilters.aslId = overviewAslId ?? this.clinicalFilters.aslId;
    }

    // Load in sequence: 1) ASL list for region, 2) structures for ASL, 3) departments for structure
    try {
      await this.loadHospitalStructuresAsync(overviewRegionCode, overviewAslCode);

      if (overviewAslCode !== undefined) {
        const selectedAsl = this.filteredAslList.find((asl) => asl.code?.trim() === overviewAslCode.trim());
        if (selectedAsl) {
          this.clinicalFilters.aslId = this.normalizeNumericId(selectedAsl.id);
        }
      }

      await this.loadDepartmentsForSelectedHospitalAsync();
      await this.loadAvailableDoctorsAsync();

      // After options are populated, assign formModel values (programmatic set, avoid triggering change handlers)
      if (overviewRegionCode !== undefined) {
        (this.formModel as any).clinicalRegionCode = overviewRegionCode;
      }
      if (overviewAslCode !== undefined) {
        (this.formModel as any).aslCode = overviewAslCode;
      }
      if (overviewAslId !== undefined) {
        (this.formModel as any).aslId = overviewAslId;
      }
      if (overviewStrutturaId !== undefined && overviewStrutturaId !== null) {
        this.formModel.hospitalId = overviewStrutturaId;
      }

      // Ensure departmentId from initialDepartmentId is applied after departments list loaded
      if (initialDepartmentId !== null && typeof initialDepartmentId === 'number') {
        this.clinicalFilters.departmentId = initialDepartmentId;
        (this.formModel as any).departmentId = initialDepartmentId;
      }
    } finally {
      // Sync select2 internal values and visible option lists
      this.syncClinicalSelections();
      this.refreshClinicalSelect2Data();
    }
  }

  private async loadHospitalStructuresAsync(overviewRegionCode?: string, overviewAslCode?: string): Promise<void> {
    const regionCode = overviewRegionCode ?? this.getNormalizedRegionCode(this.clinicalFilters.regionId);
    if (!regionCode) {
      const overviewRows = await firstValueFrom(this.structureApiService.getStructuresOverview({}).pipe(
        catchError(() => of([] as StructureOverviewLookupDto[]))
      ));
      this.aslStructures = this.mapOverviewRowsToAslStructures(overviewRows);
      this.allAssociatedAslList = [...this.aslStructures];
      this.filteredAslList = [...this.allAssociatedAslList];
      this.hospitals = [];
      this.aslOptions = [...this.filteredAslList];
      this.hospitalsList = [];
      this.syncClinicalSelections();
      return;
    }

    // 1) Fetch ASL list for the region (mandatory)
    const overviewRegion$ = this.structureApiService.getStructuresOverview({ regionCode }).pipe(
      catchError(() => of([] as StructureOverviewLookupDto[]))
    );
    const overviewRegionRows = await firstValueFrom(overviewRegion$);
    this.aslStructures = this.mapOverviewRowsToAslStructures(overviewRegionRows);
    this.allAssociatedAslList = [...this.aslStructures];
    this.filteredAslList = this.filterAslByRegion(this.allAssociatedAslList, this.clinicalFilters.regionId);
    this.aslOptions = [...this.filteredAslList];

    // 2) Fetch structures for the selected ASL (if any). Prefer explicit overviewAslCode if provided.
    const aslCodeToUse = overviewAslCode ?? this.getNormalizedAslCode(this.clinicalFilters.aslId);

    let overviewRowsForStructures: StructureOverviewLookupDto[] = [];
    if (aslCodeToUse && aslCodeToUse.trim().length) {
      const overviewStructures$ = this.structureApiService.getStructuresOverview({ regionCode, aslCode: aslCodeToUse }).pipe(
        catchError(() => of([] as StructureOverviewLookupDto[]))
      );
      overviewRowsForStructures = await firstValueFrom(overviewStructures$);
    } else {
      // fallback: use the region rows to populate structures
      overviewRowsForStructures = overviewRegionRows;
    }

    this.hospitals = this.mapOverviewRowsToHospitalStructures(overviewRowsForStructures);
    this.hospitalsList = [...this.hospitals];
  }

  private async loadDepartmentsForSelectedHospitalAsync(): Promise<void> {
    const selectedHospital = this.resolveSelectedHospitalFromCurrentValue();
    const hospitalDatabaseId = this.normalizeNumericId(this.formModel.hospitalId) ?? this.normalizeNumericId(selectedHospital?.id);

    if (hospitalDatabaseId === null) {
      this.clearDepartmentSelection();
      return;
    }

    this.formModel.hospitalId = hospitalDatabaseId;

    const departments$ = this.structureApiService.getDepartmentsByStructure(hospitalDatabaseId).pipe(
      catchError(() => of([] as StructureDepartmentOptionDto[]))
    );

    const departments = await firstValueFrom(departments$);
    this.departmentOptions = [...departments].sort((left, right) => left.label.localeCompare(right.label, 'it', { sensitivity: 'base' }));
    if (!this.departmentOptions.some((department) => department.id === this.clinicalFilters.departmentId)) {
      this.clinicalFilters.departmentId = null;
    }
  }

  private async loadAvailableDoctorsAsync(): Promise<void> {
    const params: Record<string, string | number> = {};

    if (this.clinicalFilters.regionId !== null) {
      params['regionId'] = this.clinicalFilters.regionId;
    }

    if (this.formModel.hospitalId !== null) {
      params['hospitalId'] = this.formModel.hospitalId;
    }

    if (this.clinicalFilters.departmentId !== null) {
      params['departmentId'] = this.clinicalFilters.departmentId;
    }

    const doctors$ = this.http.get<DoctorOption[]>(`${environment.apiBaseUrl}/doctors`, { params }).pipe(
      catchError(() => of([] as DoctorOption[]))
    );

    const doctors = await firstValueFrom(doctors$);
    this.doctors = [...doctors].sort((left, right) => left.fullName.localeCompare(right.fullName, 'it', { sensitivity: 'base' }));
  }

  private findKnownHospitalById(hospitalId: number): StructureDto | null {
    return [...this.hospitals, ...this.specialistClinics]
      .find((hospital) => this.normalizeNumericId(hospital.id) === hospitalId) ?? null;
  }

  private loadHospitalStructures(): void {
    const regionCode = this.getNormalizedRegionCode(this.clinicalFilters.regionId);
    if (!regionCode) {
      this.aslStructures = [];
      this.hospitals = [];
      this.aslOptions = [];
      this.hospitalsList = [];
      this.syncClinicalSelections();
      return;
    }

    const aslCode = this.getNormalizedAslCode(this.clinicalFilters.aslId);
    this.structureApiService.getStructuresOverview({
      regionCode,
      aslCode
    }).pipe(
      catchError(() => of([] as StructureOverviewLookupDto[]))
    ).subscribe((overviewRows) => {
      this.aslStructures = this.mapOverviewRowsToAslStructures(overviewRows);
      this.allAssociatedAslList = [...this.aslStructures];
      this.filteredAslList = this.filterAslByRegion(this.allAssociatedAslList, this.clinicalFilters.regionId);
      this.hospitals = this.mapOverviewRowsToHospitalStructures(overviewRows);
      this.aslOptions = [...this.filteredAslList];
      this.hospitalsList = [...this.hospitals];
      this.syncClinicalSelections();
    });
  }

  private filterAslByRegion(aslList: StructureDto[], regionId: number | null): StructureDto[] {
    if (regionId === null) {
      return [...aslList];
    }

    return aslList.filter((asl) => this.matchesRegion(asl.regionId, regionId));
  }

  private matchesRegion(structureRegionId: number | string | undefined, selectedRegionId: number): boolean {
    const normalizedStructureRegionId = this.normalizeNumericId(structureRegionId);
    return normalizedStructureRegionId === selectedRegionId;
  }

  private mapOverviewRowsToAslStructures(rows: StructureOverviewLookupDto[]): StructureDto[] {
    const uniqueAslByRegionAndCode = new Map<string, StructureDto>();

    for (const row of rows) {
      const aslCode = this.normalizeCodeValue(row.codiceAsl);
      if (!aslCode) {
        continue;
      }

      const aslId = this.normalizeNumericId(row.aslId) ?? this.normalizeNumericId(aslCode);
      const regionCode = this.normalizeCodeValue(row.codiceRegione);
      const regionName = (row.regione ?? '').trim();
      const aslKey = `${regionCode}:${aslCode}`;
      const aslName = [row.asl, row.denominazioneAzienda, row.aslName, row.aslDescription]
        .find((value) => typeof value === 'string' && value.trim().length)?.trim() || aslCode;
      const label = this.getAslLabel(row, aslCode);

      uniqueAslByRegionAndCode.set(aslKey, {
        id: aslId ?? undefined,
        code: aslCode,
        name: aslName,
        selectionLabel: label,
        address: '',
        cap: '',
        provinceId: '',
        regionId: regionCode ? (this.normalizeNumericId(regionCode) ?? regionCode) : '',
        region: regionName,
        phone: '',
        referents: [],
        structureType: 'ASL',
        active: true
      });
    }

    return [...uniqueAslByRegionAndCode.values()].sort((left, right) => this.getStructureLabel(left).localeCompare(this.getStructureLabel(right), 'it', { sensitivity: 'base' }));
  }

  private mapOverviewRowsToHospitalStructures(rows: StructureOverviewLookupDto[]): StructureDto[] {
    const uniqueStructuresByCode = new Map<string, StructureDto>();

    for (const row of rows) {
      const hospitalCode = this.normalizeCodeValue(row.hospitalCode ?? row.codiceStruttura);
      if (!hospitalCode) {
        continue;
      }

      const hospitalId = this.normalizeNumericId(row.hospitalId ?? row.strutturaId) ?? this.normalizeNumericId(hospitalCode);
      const aslCode = this.normalizeCodeValue(row.codiceAsl);
      const regionCode = this.normalizeCodeValue(row.codiceRegione);
      const structureName = (row.struttura ?? '').trim() || hospitalCode;
      const label = row.struttura?.trim().length ? `${row.struttura.trim()} (${hospitalCode})` : hospitalCode;

      uniqueStructuresByCode.set(hospitalCode, {
        id: hospitalId ?? undefined,
        code: hospitalCode,
        name: structureName,
        selectionLabel: label,
        address: '',
        cap: '',
        provinceId: '',
        regionId: regionCode ? (this.normalizeNumericId(regionCode) ?? regionCode) : '',
        region: (row.regione ?? '').trim(),
        phone: '',
        referents: [],
        structureType: 'HOSPITAL',
        active: true,
        parentStructureId: this.normalizeNumericId(row.aslId) ?? this.normalizeNumericId(aslCode) ?? undefined,
        parentStructureName: (row.asl ?? '').trim() || undefined
      });
    }

    return [...uniqueStructuresByCode.values()].sort((left, right) => this.getStructureLabel(left).localeCompare(this.getStructureLabel(right), 'it', { sensitivity: 'base' }));
  }

  private normalizeCodeValue(value: unknown): string {
    return String(value ?? '').trim();
  }

  private getNormalizedRegionCode(regionId: number | null): string | null {
    if (regionId === null || !Number.isFinite(regionId)) {
      return null;
    }

    return String(regionId).padStart(2, '0');
  }

  private getNormalizedAslCode(aslId: number | null): string | undefined {
    if (aslId === null || !Number.isFinite(aslId)) {
      return undefined;
    }

    const selectedAsl = this.availableAslStructures.find((structure) => this.normalizeNumericId(structure.id) === aslId) ?? null;
    if (selectedAsl?.code?.trim().length) {
      return selectedAsl.code.trim();
    }

    return String(aslId).trim();
  }

  private matchesSelectedRegion(structure: StructureDto): boolean {
    if (this.clinicalFilters.regionId === null) {
      return true;
    }

    const selectedRegion = this.regions.find((region) => region.id === this.clinicalFilters.regionId) ?? null;
    if (!selectedRegion) {
      return false;
    }

    const structureRegionId = this.normalizeNumericId(structure.regionId);
    if (structureRegionId !== null && structureRegionId === selectedRegion.id) {
      return true;
    }

    const selectedRegionName = (selectedRegion.name ?? '').trim().toLocaleLowerCase('it');
    const structureRegionName = (structure.region ?? '').trim().toLocaleLowerCase('it');
    if (!!structureRegionName && structureRegionName === selectedRegionName) {
      return true;
    }

    return false;
  }

  private loadAvailableDoctors(): void {
    const params: Record<string, string | number> = {};

    if (this.clinicalFilters.regionId !== null) {
      params['regionId'] = this.clinicalFilters.regionId;
    }

    if (this.formModel.hospitalId !== null) {
      params['hospitalId'] = this.formModel.hospitalId;
    }

    if (this.clinicalFilters.departmentId !== null) {
      params['departmentId'] = this.clinicalFilters.departmentId;
    }

    this.http.get<DoctorOption[]>(`${environment.apiBaseUrl}/doctors`, { params }).pipe(
      catchError(() => of([] as DoctorOption[]))
    ).subscribe((doctors) => {
      this.doctors = [...doctors].sort((left, right) => left.fullName.localeCompare(right.fullName, 'it', { sensitivity: 'base' }));
      this.syncClinicalSelections();
    });
  }

  private loadDepartmentsForSelectedHospital(): void {
    const selectedHospital = this.resolveSelectedHospitalFromCurrentValue();
    const hospitalDatabaseId = this.normalizeNumericId(selectedHospital?.id);

    if (hospitalDatabaseId === null) {
      this.clearDepartmentSelection();
      this.syncClinicalSelections();
      return;
    }

    this.formModel.hospitalId = hospitalDatabaseId;

    this.structureApiService.getDepartmentsByStructure(hospitalDatabaseId).pipe(
      catchError(() => of([] as StructureDepartmentOptionDto[]))
    ).subscribe((departments) => {
      this.departmentOptions = [...departments].sort((left, right) => left.label.localeCompare(right.label, 'it', { sensitivity: 'base' }));
      if (!this.departmentOptions.some((department) => department.id === this.clinicalFilters.departmentId)) {
        this.clinicalFilters.departmentId = null;
      }
      this.syncClinicalSelections();
    });
  }

  private clearDepartmentSelection(): void {
    this.clinicalFilters.departmentId = null;
    this.departmentOptions = [];
  }

  private resolveSelectedHospitalFromCurrentValue(): StructureDto | null {
    const selectedHospitalId = this.formModel.hospitalId;
    if (selectedHospitalId === null) {
      return null;
    }

    return this.availableHospitals.find((hospital) => {
      const databaseId = this.normalizeNumericId(hospital.id);
      if (databaseId !== null && databaseId === selectedHospitalId) {
        return true;
      }

      const hospitalCode = this.normalizeNumericId(hospital.code);
      return hospitalCode !== null && hospitalCode === selectedHospitalId;
    }) ?? null;
  }

  private syncClinicalSelections(): void {
    const availableStructureIds = new Set(
      this.availableHospitals
        .map((structure) => this.normalizeNumericId(structure.id))
        .filter((structureId): structureId is number => typeof structureId === 'number')
    );
    if (this.formModel.hospitalId !== null && !availableStructureIds.has(this.formModel.hospitalId)) {
      this.formModel.hospitalId = null;
      this.clearDepartmentSelection();
    }

    const availableNurseIds = new Set(this.availableNurses.map((nurse) => nurse.id));
    this.formModel.nurseIds = this.formModel.nurseIds.filter((nurseId) => availableNurseIds.has(nurseId));
    if (!this.formModel.nurseIds.includes(this.formModel.prevalentNurseId ?? -1)) {
      this.formModel.prevalentNurseId = this.formModel.nurseIds[0] ?? null;
    }

    const availableDoctorIds = new Set(this.availableDoctors.map((doctor) => doctor.id));
    this.formModel.doctorIds = this.formModel.doctorIds.filter((doctorId) => availableDoctorIds.has(doctorId));
    if (!this.formModel.doctorIds.includes(this.formModel.prevalentDoctorId ?? -1)) {
      this.formModel.prevalentDoctorId = this.formModel.doctorIds[0] ?? null;
    }

    this.syncClinicalFilterSelect2Values();
    this.refreshClinicalSelect2Data();
  }

  private syncClinicalFilterSelect2Values(): void {
    this.clinicalRegionValue = this.toSelect2Value(this.clinicalFilters.regionId);
    this.clinicalAslValue = this.toSelect2Value(this.clinicalFilters.aslId);
    this.clinicalHospitalValue = this.toSelect2Value(this.formModel.hospitalId);
  }

  private refreshClinicalSelect2Data(): void {
    const allLabel = this.getAllOptionLabel();
    this.regionSelect2Data = this.toSelect2Data(
      this.regions.map((region) => ({ id: region.id, label: region.name })),
      allLabel
    );
    this.aslSelect2Data = this.toSelect2Data(
      this.filteredAslList.map((asl) => ({ id: asl.id ?? null, label: this.getStructureLabel(asl) })),
      allLabel
    );
    this.hospitalSelect2Data = this.toSelect2Data(
      this.availableHospitals.map((hospital) => ({ id: hospital.id ?? null, label: this.getStructureLabel(hospital) })),
      allLabel
    );
  }

  private isStructureCompatibleWithFilters(structure: StructureDto): boolean {
    if (!this.matchesSelectedRegion(structure)) {
      return false;
    }

    if (this.clinicalFilters.aslId === null) {
      return true;
    }

    const parentStructureId = this.normalizeNumericId(structure.parentStructureId);
    if (parentStructureId !== null) {
      return parentStructureId === this.clinicalFilters.aslId;
    }

    const selectedAslName = this.selectedAsl?.name?.trim().toLocaleLowerCase('it') ?? '';
    const parentStructureName = structure.parentStructureName?.trim().toLocaleLowerCase('it') ?? '';
    return !!selectedAslName && selectedAslName === parentStructureName;
  }

  private toSelect2Data(options: Array<{ id: number | string | null | undefined; label: string }>, allLabel: string): Select2Option[] {
    return [
      { value: '', label: allLabel, id: '' },
      ...options
        .map((option) => ({ normalizedId: this.normalizeNumericId(option.id), label: option.label }))
        .filter((option): option is { normalizedId: number; label: string } => option.normalizedId !== null)
        .map((option) => ({ value: String(option.normalizedId), label: option.label, id: String(option.normalizedId) }))
    ];
  }

  private uniqueStructuresByIdOrName(structures: StructureDto[]): StructureDto[] {
    const uniqueByKey = new Map<string, StructureDto>();
    for (const structure of structures) {
      const id = structure.id;
      const key = typeof id === 'number' ? `id:${id}` : `name:${(structure.name ?? '').trim().toLocaleLowerCase('it')}`;
      if (!uniqueByKey.has(key)) {
        uniqueByKey.set(key, structure);
      }
    }

    return [...uniqueByKey.values()].sort((left, right) => this.getStructureLabel(left).localeCompare(this.getStructureLabel(right), 'it', { sensitivity: 'base' }));
  }

  private getAllOptionLabel(): string {
    return this.translate('search.option.all');
  }

  private toSelect2Value(value: number | null): string {
    return value === null ? '' : String(value);
  }

  private extractSingleValue(value: unknown): string {
    if (Array.isArray(value)) {
      const firstValue = value[0];
      return firstValue === null || firstValue === undefined ? '' : String(firstValue);
    }
    return value === null || value === undefined ? '' : String(value);
  }

  private normalizeSelect2Value(value: string): string {
    return value.trim();
  }

  private toNullableNumber(value: string): number | null {
    if (!value) {
      return null;
    }
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  private normalizeNumericId(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length) {
      const parsedValue = Number(value);
      return Number.isFinite(parsedValue) ? parsedValue : null;
    }

    return null;
  }

  private resolveAslForStructure(structure: StructureDto): StructureDto | null {
    const parentStructureId = this.normalizeNumericId(structure.parentStructureId);
    if (parentStructureId !== null) {
      const matchedById = this.aslStructures.find((candidate) => this.normalizeNumericId(candidate.id) === parentStructureId) ?? null;
      if (matchedById) {
        return matchedById;
      }
    }

    const parentStructureName = structure.parentStructureName?.trim().toLocaleLowerCase('it') ?? '';
    if (!parentStructureName) {
      return null;
    }

    return this.aslStructures.find((candidate) => (candidate.name?.trim().toLocaleLowerCase('it') ?? '') === parentStructureName) ?? null;
  }

  private reorderWithPrevalentFirst(ids: number[], prevalentId: number): number[] {
    const otherIds = ids.filter((currentId) => currentId !== prevalentId);
    return [prevalentId, ...otherIds];
  }

  private close(): void {
    const patientId = this.route.snapshot.queryParamMap.get('patientId');
    void this.router.navigate(['/therapeutic-plans/search'], {
      queryParams: patientId !== null ? { patientId } : {}
    });
  }

}