import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Select2, type Select2Data, type Select2Option, type Select2SearchEvent, type Select2UpdateEvent } from 'ng-select2-component';
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

interface EquipmentOption {
  id: number;
  code: string;
  equipmentTypeName?: string;
  status: string;
  serialNumber?: string;
}

interface TherapeuticPlanPayload {
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

interface TherapeuticPlanResponse extends TherapeuticPlanPayload {
  id?: number;
}

interface WizardStep {
  key: 'main' | 'clinical' | 'equipment' | 'schedule';
  title: MessageKey;
  description: MessageKey;
}

/**
 * Wizard popup del piano terapeutico con selezione guidata di riferimenti clinici e attrezzature.
 */
@Component({
  selector: 'app-therapeutic-plan-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, Select2, QtmStepModalComponent],
  templateUrl: './therapeutic-plan-crud.component.html',
  styleUrl: './therapeutic-plan-crud.component.css'
})
export class TherapeuticPlanCrudComponent implements OnInit {
  readonly titleKey = 'therapeuticPlan.title' as const;
  readonly steps: WizardStep[] = [
    { key: 'main', title: 'therapeuticPlan.folder.main', description: 'therapeuticPlan.folder.main.desc' },
    { key: 'clinical', title: 'therapeuticPlan.folder.clinical', description: 'therapeuticPlan.folder.clinical.desc' },
    { key: 'equipment', title: 'therapeuticPlan.folder.equipment', description: 'therapeuticPlan.folder.equipment.desc' },
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
  equipmentOptions: EquipmentOption[] = [];
  medicineOptions: Select2Data = [];
  selectedMedicine: MedicineLookupDto | null = null;

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

  get visibleEquipmentOptions(): EquipmentOption[] {
    const selectedIds = new Set(this.formModel.equipmentIds);
    return this.equipmentOptions
      .filter((equipment) => equipment.status === 'in_magazzino' || selectedIds.has(equipment.id))
      .sort((left, right) => {
        const leftSelected = selectedIds.has(left.id) ? 0 : 1;
        const rightSelected = selectedIds.has(right.id) ? 0 : 1;
        return leftSelected - rightSelected || left.code.localeCompare(right.code, 'it', { sensitivity: 'base' });
      });
  }

  get selectedStructure(): StructureDto | null {
    return this.structures.find((structure) => structure.id === this.formModel.structureId) ?? null;
  }

  get selectedEquipmentCount(): number {
    return this.formModel.equipmentIds.length;
  }

  get medicineSelectionInfo(): string {
    if (!this.selectedMedicine) {
      return this.translate('therapeuticPlan.field.medicineSearchHint');
    }

    return [
      this.selectedMedicine.codiceAic?.trim(),
      this.selectedMedicine.descrizione?.trim(),
      this.selectedMedicine.forma?.trim()
    ].filter((value): value is string => !!value).join(' | ');
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

  toggleEquipment(equipmentId: number): void {
    if (this.formModel.equipmentIds.includes(equipmentId)) {
      this.formModel.equipmentIds = this.formModel.equipmentIds.filter((currentId) => currentId !== equipmentId);
      return;
    }

    this.formModel.equipmentIds = [...this.formModel.equipmentIds, equipmentId];
  }

  isEquipmentSelected(equipmentId: number): boolean {
    return this.formModel.equipmentIds.includes(equipmentId);
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

  onMedicineSearch(event: Select2SearchEvent): void {
    const query = event.search?.trim() ?? '';
    if (query.length < 2) {
      event.filteredData(this.medicineOptions);
      return;
    }

    this.medicineApiService.lookupMedicines(query).pipe(
      catchError(() => of([] as MedicineLookupDto[]))
    ).subscribe((medicines) => {
      const data = this.mergeMedicineOptions(medicines);
      event.filteredData(data);
    });
  }

  onMedicineUpdate(event: Select2UpdateEvent): void {
    const selectedValue = typeof event.value === 'string' ? event.value : '';
    this.formModel.drugCode = selectedValue;

    const selectedOption = event.options?.[0]?.data as MedicineLookupDto | undefined;
    this.selectedMedicine = selectedOption ?? this.selectedMedicine;
    if (selectedOption) {
      this.mergeMedicineOptions([selectedOption]);
    }
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
      equipment: this.http.get<EquipmentOption[]>(`${environment.apiBaseUrl}/equipment`).pipe(catchError(() => of([] as EquipmentOption[]))),
      medicines: this.medicineApiService.lookupMedicines().pipe(catchError(() => of([] as MedicineLookupDto[])))
    }).subscribe({
      next: ({ patients, hospitals, specialistClinics, nurses, doctors, equipment, medicines }) => {
        this.patients = [...patients].sort((left, right) => this.getPatientLabel(left).localeCompare(this.getPatientLabel(right), 'it', { sensitivity: 'base' }));
        this.structures = [...hospitals, ...specialistClinics].sort((left, right) => this.getStructureLabel(left).localeCompare(this.getStructureLabel(right), 'it', { sensitivity: 'base' }));
        this.nurses = [...nurses]
          .filter((nurse) => nurse.enabled !== false)
          .sort((left, right) => left.fullName.localeCompare(right.fullName, 'it', { sensitivity: 'base' }));
        this.doctors = [...doctors].sort((left, right) => left.fullName.localeCompare(right.fullName, 'it', { sensitivity: 'base' }));
        this.equipmentOptions = equipment ?? [];
        this.medicineOptions = this.buildMedicineSelectData(medicines ?? []);

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
          nurseId: typeof plan.nurseId === 'number' ? plan.nurseId : null,
          doctorId: typeof plan.doctorId === 'number' ? plan.doctorId : null,
          drugCode: typeof plan.drugCode === 'string' ? plan.drugCode : '',
          startDate: typeof plan.startDate === 'string' ? plan.startDate : '',
          endDate: typeof plan.endDate === 'string' ? plan.endDate : '',
          status: typeof plan.status === 'string' ? plan.status : 'draft',
          notes: typeof plan.notes === 'string' ? plan.notes : ''
        };
        this.loadSelectedMedicine(plan.drugCode);
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
      if (!this.formModel.nurseId) {
        this.errorMessage = this.translate('therapeuticPlan.validation.nurseRequired');
        return false;
      }
      if (!this.formModel.doctorId) {
        this.errorMessage = this.translate('therapeuticPlan.validation.doctorRequired');
        return false;
      }
    }

    if (this.currentStep.key === 'equipment' && this.formModel.equipmentIds.length === 0) {
      this.errorMessage = this.translate('therapeuticPlan.validation.equipmentRequired');
      return false;
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
      nurseId: this.formModel.nurseId,
      doctorId: this.formModel.doctorId,
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
      nurseId: null,
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

  private close(): void {
    void this.router.navigateByUrl('/therapeutic-plans/search');
  }

  private loadSelectedMedicine(drugCode: string): void {
    const normalizedDrugCode = drugCode?.trim();
    if (!normalizedDrugCode) {
      this.selectedMedicine = null;
      return;
    }

    this.medicineApiService.getMedicineByCodiceAic(normalizedDrugCode).pipe(
      catchError(() => of(null))
    ).subscribe((medicine) => {
      this.selectedMedicine = medicine;
      if (medicine) {
        this.mergeMedicineOptions([medicine]);
      }
    });
  }

  private buildMedicineSelectData(medicines: MedicineLookupDto[]): Select2Data {
    return medicines
      .filter((medicine) => !!medicine?.codiceAic)
      .map((medicine) => this.toMedicineOption(medicine));
  }

  private mergeMedicineOptions(medicines: MedicineLookupDto[]): Select2Data {
    const medicinesByCodiceAic = new Map<string, MedicineLookupDto>();
    for (const currentOption of this.medicineOptions) {
      if ('options' in currentOption) {
        continue;
      }
      const medicine = currentOption.data as MedicineLookupDto | undefined;
      const codiceAic = typeof currentOption.value === 'string' ? currentOption.value : medicine?.codiceAic;
      if (codiceAic) {
        medicinesByCodiceAic.set(codiceAic, medicine ?? { codiceAic, denominazione: currentOption.label });
      }
    }

    for (const medicine of medicines) {
      if (medicine?.codiceAic) {
        medicinesByCodiceAic.set(medicine.codiceAic, medicine);
      }
    }

    const mergedData = Array.from(medicinesByCodiceAic.values())
      .sort((left, right) => this.getMedicineLabel(left).localeCompare(this.getMedicineLabel(right), 'it', { sensitivity: 'base' }))
      .map((medicine) => this.toMedicineOption(medicine));

    this.medicineOptions = mergedData;
    return mergedData;
  }

  private toMedicineOption(medicine: MedicineLookupDto): Select2Option {
    return {
      value: medicine.codiceAic,
      label: this.getMedicineLabel(medicine),
      data: medicine
    };
  }

  private getMedicineLabel(medicine: MedicineLookupDto): string {
    const denominazione = medicine.denominazione?.trim();
    const codiceAic = medicine.codiceAic?.trim() ?? '';
    return denominazione?.length ? `${denominazione} (${codiceAic})` : codiceAic;
  }
}