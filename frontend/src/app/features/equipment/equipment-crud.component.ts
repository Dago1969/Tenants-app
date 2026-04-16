import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { MessageKey, t } from '../../i18n/messages';
import { QtmStepModalComponent } from '../../shared/qtm-step-modal.component';

interface EquipmentTypeOption {
  id: number;
  code: string;
  name: string;
  serialNumberRequired: boolean;
  principalJsonPresent: boolean;
  principalJsonPath: string | null;
  secondaryJsonPresent: boolean;
  secondaryJsonPath: string | null;
}

interface EquipmentFormModel {
  id: number | null;
  equipmentTypeId: number | null;
  code: string;
  status: string;
  serialNumber: string;
  location: string;
  assignedTo: string;
  purchaseDate: string;
  lastRevisionDate: string;
  nextRevisionDate: string;
  notes: string;
  primaryJson: string;
  secondaryJson: string;
}

interface WizardStep {
  key: 'main' | 'details' | 'primary-json' | 'secondary-json';
  title: string;
  description: string;
}

interface JsonConfigEntry {
  path: string;
  valueType: 'string' | 'number' | 'boolean' | 'json' | 'null';
  stringValue: string;
  numberValue: number | null;
  booleanValue: boolean;
}

interface AdditionalMetadataEntry {
  key: string;
  value: string;
}

interface SecondaryJsonState {
  deviceId: string;
  timestampUpdate: string;
  customLogs: unknown[];
  extensibilityFlag: boolean;
}

/**
 * Wizard popup dedicato alle attrezzature con step dinamici guidati dal tipo selezionato.
 */
@Component({
  selector: 'app-equipment-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, QtmStepModalComponent],
  templateUrl: './equipment-crud.component.html',
  styleUrl: './equipment-crud.component.css'
})
export class EquipmentCrudComponent implements OnInit {
  readonly titleKey = 'equipment.title' as const;
  readonly statusOptions = [
    { value: 'in_magazzino', labelKey: 'status.in_magazzino' as const },
    { value: 'assegnato', labelKey: 'status.assegnato' as const },
    { value: 'in_revisione', labelKey: 'status.in_revisione' as const },
    { value: 'rotto', labelKey: 'status.rotto' as const }
  ];

  loading = true;
  saving = false;
  currentStepIndex = 0;
  equipmentId: number | null = null;
  equipmentTypes: EquipmentTypeOption[] = [];
  selectedEquipmentType: EquipmentTypeOption | null = null;
  equipmentTypeLocked = false;
  primaryJsonEntries: JsonConfigEntry[] = [];
  secondaryMetadataEntries: AdditionalMetadataEntry[] = [];
  secondaryJsonState: SecondaryJsonState = this.createEmptySecondaryJsonState();
  secondaryJsonExtensible = false;
  primaryTemplateError = '';
  secondaryTemplateError = '';
  errorMessage = '';

  formModel: EquipmentFormModel = this.createEmptyFormModel();

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.equipmentId = idParam ? Number(idParam) : null;
    this.loadEquipmentTypes();
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  get steps(): WizardStep[] {
    const baseSteps: WizardStep[] = [
      {
        key: 'main',
        title: this.translate('equipment.folder.main'),
        description: this.translate('equipment.folder.main.desc')
      },
      {
        key: 'details',
        title: this.translate('equipment.folder.details'),
        description: this.translate('equipment.folder.details.desc')
      }
    ];

    if (this.selectedEquipmentType?.principalJsonPresent) {
      baseSteps.push({
        key: 'primary-json',
        title: this.translate('equipment.field.primaryJson'),
        description: ''
      });
    }

    if (this.selectedEquipmentType?.secondaryJsonPresent) {
      baseSteps.push({
        key: 'secondary-json',
        title: this.translate('equipment.field.secondaryJson'),
        description: ''
      });
    }

    return baseSteps;
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

  get stepTitle(): string {
    return this.currentStep.title;
  }

  get stepDescription(): string {
    return this.currentStep.description;
  }

  get serialNumberRequired(): boolean {
    return this.selectedEquipmentType?.serialNumberRequired === true;
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

  onEquipmentTypeChange(rawValue: string): void {
    if (this.equipmentTypeLocked) {
      return;
    }

    const equipmentTypeId = Number(rawValue);
    if (!Number.isFinite(equipmentTypeId) || equipmentTypeId <= 0) {
      this.selectedEquipmentType = null;
      this.formModel.equipmentTypeId = null;
      this.primaryJsonEntries = [];
      this.resetSecondaryJsonState();
      this.primaryTemplateError = '';
      this.secondaryTemplateError = '';
      return;
    }

    const selectedType = this.equipmentTypes.find((equipmentType) => equipmentType.id === equipmentTypeId) ?? null;
    this.selectedEquipmentType = selectedType;
    this.formModel.equipmentTypeId = selectedType?.id ?? null;
    this.equipmentTypeLocked = selectedType !== null;
    this.rebuildJsonConfigurations();
    this.keepStepIndexInRange();
  }

  save(): void {
    this.errorMessage = '';
    if (!this.canLeaveCurrentStep() || this.saving) {
      return;
    }

    const payload = this.buildPayload();
    this.saving = true;

    const request = this.equipmentId === null
      ? this.http.post(`${environment.apiBaseUrl}/equipment`, payload)
      : this.http.put(`${environment.apiBaseUrl}/equipment/${this.equipmentId}`, payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        void this.router.navigateByUrl('/equipment/search');
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  cancel(): void {
    void this.router.navigateByUrl('/equipment/search');
  }

  private loadEquipmentTypes(): void {
    this.http.get<EquipmentTypeOption[]>(`${environment.apiBaseUrl}/equipment-types`).subscribe({
      next: (equipmentTypes) => {
        this.equipmentTypes = equipmentTypes ?? [];
        if (this.equipmentId === null) {
          this.loading = false;
          return;
        }

        this.loadEquipment();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private loadEquipment(): void {
    this.http.get<Partial<EquipmentFormModel>>(`${environment.apiBaseUrl}/equipment/${this.equipmentId}`).subscribe({
      next: (equipment) => {
        this.formModel = {
          ...this.createEmptyFormModel(),
          ...equipment,
          id: this.equipmentId,
          code: typeof equipment.code === 'string' ? equipment.code : '',
          status: typeof equipment.status === 'string' ? equipment.status : 'in_magazzino',
          serialNumber: typeof equipment.serialNumber === 'string' ? equipment.serialNumber : '',
          location: typeof equipment.location === 'string' ? equipment.location : '',
          assignedTo: typeof equipment.assignedTo === 'string' ? equipment.assignedTo : '',
          purchaseDate: typeof equipment.purchaseDate === 'string' ? equipment.purchaseDate : '',
          lastRevisionDate: typeof equipment.lastRevisionDate === 'string' ? equipment.lastRevisionDate : '',
          nextRevisionDate: typeof equipment.nextRevisionDate === 'string' ? equipment.nextRevisionDate : '',
          notes: typeof equipment.notes === 'string' ? equipment.notes : '',
          primaryJson: typeof equipment.primaryJson === 'string' ? equipment.primaryJson : '',
          secondaryJson: typeof equipment.secondaryJson === 'string' ? equipment.secondaryJson : '',
          equipmentTypeId: typeof equipment.equipmentTypeId === 'number' ? equipment.equipmentTypeId : null
        };

        this.selectedEquipmentType = this.equipmentTypes.find(
          (equipmentType) => equipmentType.id === this.formModel.equipmentTypeId
        ) ?? null;
        this.equipmentTypeLocked = this.selectedEquipmentType !== null;
        this.rebuildJsonConfigurations();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private rebuildJsonConfigurations(): void {
    this.primaryJsonEntries = this.selectedEquipmentType?.principalJsonPresent
      ? this.buildJsonEntries(this.selectedEquipmentType.principalJsonPath, this.formModel.primaryJson)
      : [];
    this.primaryTemplateError = '';

    if (!this.selectedEquipmentType?.principalJsonPresent) {
      this.formModel.primaryJson = '';
      this.primaryTemplateError = '';
    }

    if (this.selectedEquipmentType?.secondaryJsonPresent) {
      this.configureSecondaryJsonState(this.selectedEquipmentType.secondaryJsonPath, this.formModel.secondaryJson);
    } else {
      this.formModel.secondaryJson = '';
      this.resetSecondaryJsonState();
    }
  }

  private buildJsonEntries(templateSource: string | null, currentJson: string): JsonConfigEntry[] {
    const parsedTemplate = this.tryParseJson(templateSource);
    const parsedCurrent = this.tryParseJson(currentJson);
    const templateValues = this.flattenJson(parsedTemplate);
    const currentValues = this.flattenJson(parsedCurrent);
    const orderedKeys = [...templateValues.keys()];

    currentValues.forEach((_value, key) => {
      if (!orderedKeys.includes(key)) {
        orderedKeys.push(key);
      }
    });

    return orderedKeys.map((key) => this.toJsonConfigEntry(key, currentValues.has(key) ? currentValues.get(key) : templateValues.get(key)));
  }

  private configureSecondaryJsonState(templateSource: string | null, currentJson: string): void {
    const templateRoot = this.asJsonObject(this.tryParseJson(templateSource));
    const currentRoot = this.asJsonObject(this.tryParseJson(currentJson));
    const mergedMetadata = new Map<string, string>();

    this.collectAdditionalMetadata(templateRoot).forEach((value, key) => {
      mergedMetadata.set(key, value);
    });

    this.collectAdditionalMetadata(currentRoot).forEach((value, key) => {
      mergedMetadata.set(key, value);
    });

    this.secondaryJsonState = {
      deviceId: this.resolveSecondaryString(currentRoot['device_id'], templateRoot['device_id']),
      timestampUpdate: this.resolveSecondaryString(currentRoot['timestamp_update'], templateRoot['timestamp_update']),
      customLogs: this.resolveSecondaryArray(currentRoot['custom_logs'], templateRoot['custom_logs']),
      extensibilityFlag: this.resolveSecondaryBoolean(currentRoot['extensibility_flag'], templateRoot['extensibility_flag'])
    };
    this.secondaryJsonExtensible = this.secondaryJsonState.extensibilityFlag;
    this.secondaryMetadataEntries = Array.from(mergedMetadata.entries()).map(([key, value]) => ({ key, value }));
    this.secondaryTemplateError = '';
  }

  addSecondaryMetadataEntry(): void {
    if (!this.secondaryJsonExtensible) {
      return;
    }

    this.secondaryMetadataEntries = [...this.secondaryMetadataEntries, { key: '', value: '' }];
  }

  removeSecondaryMetadataEntry(index: number): void {
    this.secondaryMetadataEntries = this.secondaryMetadataEntries.filter((_, currentIndex) => currentIndex !== index);
  }

  private toJsonConfigEntry(path: string, rawValue: unknown): JsonConfigEntry {
    if (typeof rawValue === 'boolean') {
      return {
        path,
        valueType: 'boolean',
        stringValue: rawValue ? 'true' : 'false',
        numberValue: null,
        booleanValue: rawValue
      };
    }

    if (typeof rawValue === 'number') {
      return {
        path,
        valueType: 'number',
        stringValue: String(rawValue),
        numberValue: rawValue,
        booleanValue: false
      };
    }

    if (rawValue === null) {
      return {
        path,
        valueType: 'null',
        stringValue: '',
        numberValue: null,
        booleanValue: false
      };
    }

    if (Array.isArray(rawValue) || this.isPlainObject(rawValue)) {
      return {
        path,
        valueType: 'json',
        stringValue: JSON.stringify(rawValue, null, 2),
        numberValue: null,
        booleanValue: false
      };
    }

    return {
      path,
      valueType: 'string',
      stringValue: rawValue == null ? '' : String(rawValue),
      numberValue: null,
      booleanValue: false
    };
  }

  private flattenJson(rawValue: unknown, parentPath = ''): Map<string, unknown> {
    const flattened = new Map<string, unknown>();

    if (!this.isPlainObject(rawValue)) {
      return flattened;
    }

    Object.entries(rawValue).forEach(([key, value]) => {
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      if (this.isPlainObject(value)) {
        const nested = this.flattenJson(value, currentPath);
        if (nested.size === 0) {
          flattened.set(currentPath, {});
        } else {
          nested.forEach((nestedValue, nestedKey) => flattened.set(nestedKey, nestedValue));
        }
        return;
      }

      flattened.set(currentPath, value);
    });

    return flattened;
  }

  private tryParseJson(rawValue: string | null | undefined): unknown {
    const normalizedValue = (rawValue ?? '').trim();
    if (!normalizedValue) {
      return {};
    }

    try {
      return JSON.parse(normalizedValue);
    } catch {
      return {};
    }
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private buildPayload(): Record<string, unknown> {
    return {
      equipmentTypeId: this.formModel.equipmentTypeId,
      code: this.formModel.code.trim(),
      status: this.formModel.status,
      serialNumber: this.formModel.serialNumber.trim(),
      location: this.formModel.location.trim(),
      assignedTo: this.formModel.assignedTo.trim(),
      purchaseDate: this.formModel.purchaseDate || null,
      lastRevisionDate: this.formModel.lastRevisionDate || null,
      nextRevisionDate: this.formModel.nextRevisionDate || null,
      notes: this.formModel.notes.trim(),
      primaryJson: this.selectedEquipmentType?.principalJsonPresent ? this.buildJsonString(this.primaryJsonEntries) : null,
      secondaryJson: this.selectedEquipmentType?.secondaryJsonPresent ? this.buildSecondaryJsonString() : null
    };
  }

  private buildSecondaryJsonString(): string {
    const additionalMetadata = this.secondaryMetadataEntries.reduce<Record<string, string>>((accumulator, entry) => {
      const normalizedKey = entry.key.trim();
      if (!normalizedKey) {
        return accumulator;
      }

      accumulator[normalizedKey] = entry.value;
      return accumulator;
    }, {});

    return JSON.stringify({
      device_id: this.secondaryJsonState.deviceId,
      timestamp_update: this.secondaryJsonState.timestampUpdate,
      custom_logs: this.secondaryJsonState.customLogs,
      extensibility_flag: this.secondaryJsonState.extensibilityFlag,
      additional_metadata: additionalMetadata
    });
  }

  private buildJsonString(entries: JsonConfigEntry[]): string | null {
    if (entries.length === 0) {
      return null;
    }

    const root: Record<string, unknown> = {};
    entries.forEach((entry) => this.setNestedValue(root, entry.path, this.getEntryValue(entry)));
    return JSON.stringify(root);
  }

  private setNestedValue(root: Record<string, unknown>, path: string, value: unknown): void {
    const pathSegments = path.split('.').filter((segment) => segment.length > 0);
    if (pathSegments.length === 0) {
      return;
    }

    let current: Record<string, unknown> = root;
    pathSegments.forEach((segment, index) => {
      if (index === pathSegments.length - 1) {
        current[segment] = value;
        return;
      }

      const nested = current[segment];
      if (!this.isPlainObject(nested)) {
        current[segment] = {};
      }
      current = current[segment] as Record<string, unknown>;
    });
  }

  private getEntryValue(entry: JsonConfigEntry): unknown {
    switch (entry.valueType) {
      case 'boolean':
        return entry.booleanValue;
      case 'number':
        return entry.numberValue ?? 0;
      case 'json':
        return this.tryParseJson(entry.stringValue);
      case 'null':
        return entry.stringValue.trim().length === 0 ? null : entry.stringValue;
      case 'string':
      default:
        return entry.stringValue;
    }
  }

  private canLeaveCurrentStep(): boolean {
    switch (this.currentStep.key) {
      case 'main':
        return this.validateMainStep();
      case 'primary-json':
        return this.validatePrimaryJsonEntries();
      case 'secondary-json':
        return this.validateSecondaryMetadataEntries();
      case 'details':
      default:
        return true;
    }
  }

  private validateMainStep(): boolean {
    if (!this.formModel.code.trim()) {
      this.errorMessage = this.translate('equipment.validation.codeRequired');
      return false;
    }

    if (!this.formModel.equipmentTypeId) {
      this.errorMessage = this.translate('equipment.validation.typeRequired');
      return false;
    }

    if (!this.formModel.status.trim()) {
      this.errorMessage = this.translate('equipment.validation.statusRequired');
      return false;
    }

    if (this.serialNumberRequired && !this.formModel.serialNumber.trim()) {
      this.errorMessage = this.translate('equipment.validation.serialRequired');
      return false;
    }

    this.errorMessage = '';
    return true;
  }

  private validatePrimaryJsonEntries(): boolean {
    const invalidJsonEntry = this.primaryJsonEntries.find(
      (entry) => entry.valueType === 'json' && !this.isValidJsonFragment(entry.stringValue)
    );
    if (invalidJsonEntry) {
      this.errorMessage = this.translate('equipment.validation.primaryJsonInvalid');
      return false;
    }

    this.errorMessage = '';
    return true;
  }

  private validateSecondaryMetadataEntries(): boolean {
    const missingKeyEntry = this.secondaryMetadataEntries.find(
      (entry) => entry.key.trim().length === 0 && entry.value.trim().length > 0
    );
    if (missingKeyEntry) {
      this.errorMessage = `${this.translate('equipment.field.secondaryJson')}: ${this.translate('crud.validation.required')}`;
      return false;
    }

    this.errorMessage = '';
    return true;
  }

  private isValidJsonFragment(rawValue: string): boolean {
    const normalizedValue = rawValue.trim();
    if (!normalizedValue) {
      return false;
    }

    try {
      JSON.parse(normalizedValue);
      return true;
    } catch {
      return false;
    }
  }

  private keepStepIndexInRange(): void {
    if (this.currentStepIndex >= this.steps.length) {
      this.currentStepIndex = Math.max(this.steps.length - 1, 0);
    }
  }

  private collectAdditionalMetadata(source: Record<string, unknown>): Map<string, string> {
    const metadata = new Map<string, string>();
    const additionalMetadata = source['additional_metadata'];

    if (this.isPlainObject(additionalMetadata)) {
      Object.entries(additionalMetadata).forEach(([key, value]) => {
        metadata.set(key, this.toMetadataDisplayValue(value));
      });
    }

    Object.entries(source).forEach(([key, value]) => {
      if (['device_id', 'timestamp_update', 'custom_logs', 'extensibility_flag', 'additional_metadata'].includes(key)) {
        return;
      }

      metadata.set(key, this.toMetadataDisplayValue(value));
    });

    return metadata;
  }

  private toMetadataDisplayValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (value == null) {
      return '';
    }

    return JSON.stringify(value);
  }

  private asJsonObject(value: unknown): Record<string, unknown> {
    return this.isPlainObject(value) ? value : {};
  }

  private resolveSecondaryString(currentValue: unknown, templateValue: unknown): string {
    if (typeof currentValue === 'string') {
      return currentValue;
    }

    if (typeof templateValue === 'string') {
      return templateValue;
    }

    return '';
  }

  private resolveSecondaryArray(currentValue: unknown, templateValue: unknown): unknown[] {
    if (Array.isArray(currentValue)) {
      return [...currentValue];
    }

    if (Array.isArray(templateValue)) {
      return [...templateValue];
    }

    return [];
  }

  private resolveSecondaryBoolean(currentValue: unknown, templateValue: unknown): boolean {
    if (typeof currentValue === 'boolean') {
      return currentValue;
    }

    if (typeof templateValue === 'boolean') {
      return templateValue;
    }

    return true;
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    const serverMessage = typeof error.error?.message === 'string'
      ? error.error.message
      : typeof error.error?.detail === 'string'
        ? error.error.detail
        : '';

    return serverMessage || this.translate('equipment.error.save');
  }

  private createEmptyFormModel(): EquipmentFormModel {
    return {
      id: null,
      equipmentTypeId: null,
      code: '',
      status: 'in_magazzino',
      serialNumber: '',
      location: '',
      assignedTo: '',
      purchaseDate: '',
      lastRevisionDate: '',
      nextRevisionDate: '',
      notes: '',
      primaryJson: '',
      secondaryJson: ''
    };
  }

  private createEmptySecondaryJsonState(): SecondaryJsonState {
    return {
      deviceId: '',
      timestampUpdate: '',
      customLogs: [],
      extensibilityFlag: true
    };
  }

  private resetSecondaryJsonState(): void {
    this.secondaryMetadataEntries = [];
    this.secondaryJsonState = this.createEmptySecondaryJsonState();
    this.secondaryJsonExtensible = false;
    this.secondaryTemplateError = '';
  }
}