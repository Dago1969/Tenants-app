import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { MedicineApiService, type MedicineLookupDto } from '../../core/medicine-api.service';
import { StructureApiService, StructureDto } from '../../core/structure-api.service';
import { MessageKey, t } from '../../i18n/messages';
import { QtmStepModalComponent } from '../../shared/qtm-step-modal.component';

interface PatientOption {
  id: number;
  assistedId?: string;
  firstName?: string;
  lastName?: string;
}

interface NurseOption {
  id: number;
  fullName: string;
  enabled?: boolean;
}

interface DoctorOption {
  id: number;
  fullName: string;
  specialization?: string;
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
  structureId: number | null;
  nurseIds: number[];
  prevalentNurseId: number | null;
  nurseId?: number | null;
  doctorIds: number[];
  prevalentDoctorId: number | null;
  doctorId?: number | null;
  drugCode: string;
  startDate: string;
  endDate: string;
  status: string;
  notes: string;
}

interface TherapeuticPlanResponse extends TherapeuticPlanPayload {
  id?: number;
  nurseNames?: string[];
  doctorNames?: string[];
  nurseAssignments?: TherapeuticPlanProfessionalAssignment[];
  doctorAssignments?: TherapeuticPlanProfessionalAssignment[];
}

interface WizardStep {
  key: 'main' | 'clinical' | 'schedule';
  title: MessageKey;
  description: MessageKey;
}

/**
 * Wizard popup del piano terapeutico con selezione guidata dei riferimenti clinici.
 */
@Component({
  selector: 'app-therapeutic-plan-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, QtmStepModalComponent],
  templateUrl: './therapeutic-plan-crud.component.html',
  styleUrl: './therapeutic-plan-crud.component.css'
})
export class TherapeuticPlanCrudComponent implements OnInit {
  readonly titleKey = 'therapeuticPlan.title' as const;
  readonly steps: WizardStep[] = [
    { key: 'main', title: 'therapeuticPlan.folder.main', description: 'therapeuticPlan.folder.main.desc' },
    { key: 'clinical', title: 'therapeuticPlan.folder.clinical', description: 'therapeuticPlan.folder.clinical.desc' },
    { key: 'schedule', title: 'therapeuticPlan.folder.schedule', description: 'therapeuticPlan.folder.schedule.desc' }
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

  patients: PatientOption[] = [];
  structures: StructureDto[] = [];
  nurses: NurseOption[] = [];
  doctors: DoctorOption[] = [];
  medicineOptions: { value: string, label: string }[] = [];

  formModel: TherapeuticPlanPayload = this.createEmptyFormModel();

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly medicineApiService: MedicineApiService,
    private readonly structureApiService: StructureApiService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.therapeuticPlanId = idParam ? Number(idParam) : null;
    this.formModel.projectCode = this.authService.getSelectedProject().trim();
    this.loadReferenceData();
  }

  translate(key: MessageKey | string): string {
    try {
      return t(key as MessageKey);
    } catch {
      return key;
    }
  }

  get currentStep(): WizardStep {
    return this.steps[this.currentStepIndex] ?? this.steps[0];
  }

  get isFirstStep(): boolean {
    return this.currentStepIndex === 0;
  }

  get isLastStep(): boolean {
    return this.currentStepIndex === this.steps.length - 1;
  }

  get selectedStructure(): StructureDto | null {
    return this.structures.find((structure) => structure.id === this.formModel.structureId) ?? null;
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

  get medicineSelectionInfo(): string {
    if (!this.formModel.drugCode) {
      return '';
    }
    const med = this.medicineOptions.find(opt => opt.value === this.formModel.drugCode);
    return med ? med.label : '';
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

    this.currentStepIndex += 1;
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

  private loadReferenceData(): void {
    forkJoin({
      patients: this.http.get<PatientOption[]>(`${environment.apiBaseUrl}/patients`).pipe(catchError(() => of([] as PatientOption[]))),
      hospitals: this.structureApiService.getStructuresByType('HOSPITAL', true).pipe(catchError(() => of([] as StructureDto[]))),
      specialistClinics: this.structureApiService.getStructuresByType('SPECIALIST_CLINIC', true).pipe(catchError(() => of([] as StructureDto[]))),
      nurses: this.http.get<NurseOption[]>(`${environment.apiBaseUrl}/nurses`).pipe(catchError(() => of([] as NurseOption[]))),
      doctors: this.http.get<DoctorOption[]>(`${environment.apiBaseUrl}/doctors`).pipe(catchError(() => of([] as DoctorOption[]))),
      medicines: this.medicineApiService.lookupMedicines().pipe(catchError(() => of([] as MedicineLookupDto[])))
    }).subscribe({
      next: ({ patients, hospitals, specialistClinics, nurses, doctors, medicines }) => {
        this.patients = [...patients].sort((left, right) => this.getPatientLabel(left).localeCompare(this.getPatientLabel(right), 'it', { sensitivity: 'base' }));
        this.structures = [...hospitals, ...specialistClinics].sort((left, right) => this.getStructureLabel(left).localeCompare(this.getStructureLabel(right), 'it', { sensitivity: 'base' }));
        this.nurses = [...nurses]
          .filter((nurse) => nurse.enabled !== false)
          .sort((left, right) => left.fullName.localeCompare(right.fullName, 'it', { sensitivity: 'base' }));
        this.doctors = [...doctors].sort((left, right) => left.fullName.localeCompare(right.fullName, 'it', { sensitivity: 'base' }));
        this.medicineOptions = (medicines ?? [])
          .filter((medicine) => !!medicine?.codiceAic)
          .map((medicine) => ({
            value: medicine.codiceAic,
            label: [medicine.codiceAic, medicine.denominazione, medicine.forma].filter(Boolean).join(' | ')
          }));

        if (this.therapeuticPlanId === null) {
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
        this.formModel = {
          patientId: typeof plan.patientId === 'number' ? plan.patientId : null,
          projectCode: typeof plan.projectCode === 'string' && plan.projectCode.trim().length ? plan.projectCode : this.authService.getSelectedProject().trim(),
          equipmentIds: Array.isArray(plan.equipmentIds) ? plan.equipmentIds.filter((currentId): currentId is number => typeof currentId === 'number') : [],
          structureId: typeof plan.structureId === 'number' ? plan.structureId : null,
          nurseIds: this.normalizeLoadedProfessionalIds(plan.nurseIds, plan.prevalentNurseId, plan.nurseId),
          prevalentNurseId: this.resolveLoadedPrevalentId(plan.nurseIds, plan.prevalentNurseId, plan.nurseId),
          nurseId: typeof plan.nurseId === 'number' ? plan.nurseId : null,
          doctorIds: this.normalizeLoadedProfessionalIds(plan.doctorIds, plan.prevalentDoctorId, plan.doctorId),
          prevalentDoctorId: this.resolveLoadedPrevalentId(plan.doctorIds, plan.prevalentDoctorId, plan.doctorId),
          doctorId: typeof plan.doctorId === 'number' ? plan.doctorId : null,
          drugCode: typeof plan.drugCode === 'string' ? plan.drugCode : '',
          startDate: typeof plan.startDate === 'string' ? plan.startDate : '',
          endDate: typeof plan.endDate === 'string' ? plan.endDate : '',
          status: typeof plan.status === 'string' ? plan.status : 'draft',
          notes: typeof plan.notes === 'string' ? plan.notes : ''
        };
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
      if (!this.formModel.structureId) {
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

    return true;
  }

  private buildPayload(): TherapeuticPlanPayload {
    return {
      patientId: this.formModel.patientId,
      projectCode: this.formModel.projectCode.trim(),
      equipmentIds: [...this.formModel.equipmentIds],
      structureId: this.formModel.structureId,
      nurseIds: [...this.formModel.nurseIds],
      prevalentNurseId: this.formModel.prevalentNurseId,
      nurseId: this.formModel.prevalentNurseId,
      doctorIds: [...this.formModel.doctorIds],
      prevalentDoctorId: this.formModel.prevalentDoctorId,
      doctorId: this.formModel.prevalentDoctorId,
      drugCode: this.formModel.drugCode.trim(),
      startDate: this.formModel.startDate,
      endDate: this.formModel.endDate,
      status: this.formModel.status,
      notes: this.formModel.notes.trim()
    };
  }

  private createEmptyFormModel(): TherapeuticPlanPayload {
    return {
      patientId: null,
      projectCode: '',
      equipmentIds: [],
      structureId: null,
      nurseIds: [],
      prevalentNurseId: null,
      nurseId: null,
      doctorIds: [],
      prevalentDoctorId: null,
      doctorId: null,
      drugCode: '',
      startDate: '',
      endDate: '',
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

  private reorderWithPrevalentFirst(ids: number[], prevalentId: number): number[] {
    const otherIds = ids.filter((currentId) => currentId !== prevalentId);
    return [prevalentId, ...otherIds];
  }

  private close(): void {
    void this.router.navigateByUrl('/therapeutic-plans/search');
  }

  private getMedicineLabel(medicine: MedicineLookupDto): string {
    const denominazione = medicine.denominazione?.trim();
    const codiceAic = medicine.codiceAic?.trim() ?? '';
    return denominazione?.length ? `${denominazione} (${codiceAic})` : codiceAic;
  }
}