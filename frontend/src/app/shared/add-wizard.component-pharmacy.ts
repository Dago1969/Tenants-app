import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import intlTelInput, { type AllOptions, type Iti } from 'intl-tel-input';
import { GeographyApiService, GeographicOptionDto } from '../core/geography-api.service';
import { ReferentApiService, ReferentDto } from '../core/referent-api.service';
import { StructureApiService, StructureDto } from '../core/structure-api.service';
import { t } from '../i18n/messages';
import { NotificationService } from './notification.service';
import { QtmStepModalComponent } from './qtm-step-modal.component';

type ManagedStructureType =
  | 'HOSPITAL_PHARMACY'
  | 'RETAIL_PHARMACY'
  | 'LOGISTICS_WAREHOUSE'
  | 'MATERIAL_WAREHOUSE'
  | 'PHARMA_COMPANY'
  | 'SPECIALIST_CLINIC';

interface PharmacyOpeningSlot {
  dayOfWeek: string;
  openingTime: string;
  closingTime: string;
}

interface ParentStructureOption {
  id: number;
  code: string;
  name: string;
  selectionLabel?: string;
  structureType: string;
  structureTypeDescription?: string;
}

/**
 * Wizard popup per inserimento e modifica delle strutture gestite con catena step-based.
 */
@Component({
  selector: 'add-wizard-component-pharmacy',
  standalone: true,
  imports: [CommonModule, FormsModule, QtmStepModalComponent],
  template: `
    <qtm-step-modal
      [title]="translate(getWizardTitleKey())"
      [step]="step"
      [totalSteps]="4"
      [stepTitle]="translate(stepTitles[step - 1])"
      [stepDescription]="translate(stepDescriptions[step - 1])"
      (close)="onClose()"
    >
      <ng-container *ngIf="notificationService.notification$ | async as notif">
        <p
          class="success-message"
          [ngClass]="{
            'success-message': notif.type === 'success',
            'error-message': notif.type === 'error'
          }"
        >
          {{ notif.message }}
        </p>
      </ng-container>

      <ng-container [ngSwitch]="step">
        <form *ngSwitchCase="1" (ngSubmit)="nextStep()" #form1="ngForm">
          <div class="form-row">
            <label>{{ translate('structures.field.denom') }}<span class="required-asterisk">*</span><input type="text" name="name" [(ngModel)]="model.name" required /></label>
            <label>{{ translate('structures.field.code') }}<span class="required-asterisk">*</span><input type="text" name="code" [(ngModel)]="model.code" required /></label>
            <label>{{ translate('structures.field.structureType') }}<span class="required-asterisk">*</span>
              <div style="margin-top:8px;font-weight:600;color:#1890ff;">{{ translate(getStructureTypeLabelKey()) }}</div>
            </label>
          </div>

          <div class="form-row" *ngIf="hasParentStructure()">
            <label>{{ translate(getParentLabelKey()) }}<span class="required-asterisk">*</span>
              <select class="search-filter-select" name="parentStructureId" [(ngModel)]="model.parentStructureId" (ngModelChange)="onParentStructureChange()" required>
                <option [ngValue]="null">{{ translate('structures.select') }}</option>
                <option *ngFor="let parent of parentStructures" [ngValue]="parent.id">{{ parent.selectionLabel || parent.name }}</option>
              </select>
            </label>
          </div>

          <div class="form-row">
            <label>{{ translate('structures.field.regione') }}<span class="required-asterisk">*</span>
              <select class="search-filter-select" name="regionId" [(ngModel)]="model.regionId" (change)="onRegioneChange()" required>
                <option value="">{{ translate('structures.select') }}</option>
                <option *ngFor="let regione of regioni" [value]="regione.id">{{ regione.name }}</option>
              </select>
            </label>
            <label>{{ translate('structures.field.provincia') }}<span class="required-asterisk">*</span>
              <select class="search-filter-select" name="provinceId" [(ngModel)]="model.provinceId" (change)="onProvinciaChange()" [disabled]="!province.length" required>
                <option value="">{{ translate('structures.select') }}</option>
                <option *ngFor="let provincia of province" [value]="provincia.id">{{ provincia.name }}</option>
              </select>
            </label>
            <label>{{ translate('structures.field.comune') }}<span class="required-asterisk">*</span>
              <select class="search-filter-select" name="cityId" [(ngModel)]="model.cityId" (change)="onComuneChange()" [disabled]="!comuni.length" required>
                <option value="">{{ translate('structures.select') }}</option>
                <option *ngFor="let comune of comuni" [value]="comune.id">{{ comune.name }}</option>
              </select>
            </label>
          </div>

          <div class="form-row">
            <label>{{ translate('structures.field.address') }}<span class="required-asterisk">*</span>
              <input type="text" name="address" [(ngModel)]="model.address" required autocomplete="off" />
            </label>
            <label>{{ translate('structures.field.cap') }}<span class="required-asterisk">*</span>
              <input type="text" name="cap" [(ngModel)]="model.cap" maxlength="10" required autocomplete="off" />
            </label>
            <label>{{ translate('structures.field.phone') }}<span class="required-asterisk">*</span>
              <div class="phone-input-group phone-input-group-intl">
                <input #phoneInputElement type="tel" inputmode="tel" name="phone" [ngModel]="model.phone" (ngModelChange)="onPhoneModelChange($event)" required autocomplete="off" class="phone-number-input" />
              </div>
            </label>
          </div>

          <div class="form-row" style="justify-content: flex-end;">
            <button class="btn btn-primary" type="submit" [disabled]="!form1.valid">{{ translate('crud.actions.next') }}</button>
          </div>
        </form>

        <form *ngSwitchCase="2" (ngSubmit)="nextStep()" #form2="ngForm">
          <h4>{{ translate('structures.step.contacts') }}</h4>
          <div class="form-row" style="align-items: flex-end; gap: 1rem;">
            <label style="flex:1;">{{ translate('structures.field.referents') }}
              <select name="referents" [(ngModel)]="model.referents" [compareWith]="compareReferentsById" multiple required style="min-width:300px; min-height: 80px;">
                <option *ngFor="let ref of referentsList" [ngValue]="ref">{{ ref.firstName }} {{ ref.lastName }} ({{ ref.role }})</option>
              </select>
            </label>
            <button type="button" class="btn btn-secondary" (click)="showAddReferent = !showAddReferent">{{ translate('referent.actions.add') }}</button>
          </div>
          <div class="form-row" *ngIf="showAddReferent" style="margin-top: 1rem; border: 1px solid #eee; padding: 1rem; border-radius: 6px; background: #fafbfc;">
            <form (ngSubmit)="addReferent()" #addReferentForm="ngForm" style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; width: 100%;">
              <input name="firstName" [(ngModel)]="newReferent.firstName" required placeholder="{{ translate('referent.field.firstName') }}" class="form-control" style="width: 120px;" />
              <input name="lastName" [(ngModel)]="newReferent.lastName" required placeholder="{{ translate('referent.field.lastName') }}" class="form-control" style="width: 120px;" />
              <input name="role" [(ngModel)]="newReferent.role" placeholder="{{ translate('referent.field.role') }}" class="form-control" style="width: 120px;" />
              <input name="email" [(ngModel)]="newReferent.email" required placeholder="{{ translate('referent.field.email') }}" class="form-control" style="width: 180px;" type="email" />
              <div class="phone-input-group phone-input-group-intl" style="width: 140px;">
                <input #referentPhoneInputElement name="phone" [ngModel]="newReferent.phone" (ngModelChange)="onReferentPhoneModelChange($event)" required placeholder="{{ translate('referent.field.phone') }}" class="form-control phone-number-input" type="tel" inputmode="tel" autocomplete="off" />
              </div>
              <button type="submit" class="btn btn-primary" [disabled]="!addReferentForm.valid">{{ translate('referent.actions.save') }}</button>
              <button type="button" class="btn btn-outline" (click)="showAddReferent = false">{{ translate('crud.actions.cancel') }}</button>
            </form>
          </div>
        </form>

        <div *ngSwitchCase="3">
          <ng-container *ngIf="isScheduleManagedStructure(); else genericSpecificDataStep">
          <h4>{{ translate('structures.field.openingCalendar') }}</h4>
          <div *ngFor="let slot of openingSchedule; let slotIndex = index" class="form-row" style="align-items: flex-end; gap: 1rem; margin-bottom: 0.75rem;">
            <label style="flex: 1;">{{ translate('structures.field.dayOfWeek') }}<span class="required-asterisk">*</span>
              <select class="search-filter-select" [(ngModel)]="slot.dayOfWeek" [ngModelOptions]="{ standalone: true }">
                <option value="">{{ translate('structures.select') }}</option>
                <option *ngFor="let weekday of weekdays" [value]="weekday.code">{{ translate(weekday.labelKey) }}</option>
              </select>
            </label>
            <label style="flex: 1;">{{ translate('structures.field.openingTime') }}<span class="required-asterisk">*</span>
              <input type="time" [(ngModel)]="slot.openingTime" [ngModelOptions]="{ standalone: true }" />
            </label>
            <label style="flex: 1;">{{ translate('structures.field.closingTime') }}<span class="required-asterisk">*</span>
              <input type="time" [(ngModel)]="slot.closingTime" [ngModelOptions]="{ standalone: true }" />
            </label>
            <button type="button" class="btn btn-outline" (click)="removeScheduleSlot(slotIndex)" [disabled]="openingSchedule.length === 1">{{ translate('structures.actions.removeScheduleRow') }}</button>
          </div>

          <div class="form-row" style="justify-content: space-between; align-items: flex-start; gap: 1rem; margin-top: 1rem;">
            <button type="button" class="btn btn-secondary" (click)="addScheduleSlot()">{{ translate('structures.actions.addScheduleRow') }}</button>
            <div style="flex: 1; border: 1px solid #d9d9d9; border-radius: 8px; padding: 0.85rem 1rem; background: #fafafa;">
              <div style="font-weight: 600; margin-bottom: 0.5rem;">{{ translate('structures.field.schedulePreview') }}</div>
              <div *ngFor="let line of getSchedulePreviewLines()">{{ line }}</div>
              <div *ngIf="getSchedulePreviewLines().length === 0">-</div>
            </div>
          </div>
          </ng-container>
          <ng-template #genericSpecificDataStep>
            <h4>{{ translate('structures.step.specificData') }}</h4>
            <div class="form-row">
              <label style="flex: 1;">{{ translate('structures.field.description') }}
                <textarea name="description" [(ngModel)]="model.description" rows="5" style="width: 100%; resize: vertical;"></textarea>
              </label>
            </div>
            <div class="form-row">
              <label style="display:flex; align-items:center; gap:0.5rem;">
                <input type="checkbox" name="active" [(ngModel)]="model.active" />
                <span>{{ translate('structures.field.active') }}</span>
              </label>
            </div>
          </ng-template>
        </div>

        <div *ngSwitchCase="4">
          <h4>{{ translate('structures.step.summary') }}</h4>
          <div class="summary4-grid">
            <div class="summary4-row">
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.denom') }}</div>
                <div class="summary2-value">{{ model.name }}</div>
              </div>
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.code') }}</div>
                <div class="summary2-value">{{ model.code }}</div>
              </div>
              <div class="summary4-col">
                <div class="summary2-label">{{ translate(hasParentStructure() ? getParentLabelKey() : 'structures.field.email') }}</div>
                <div class="summary2-value">{{ hasParentStructure() ? (model.parentStructureName || '-') : (model.email || '-') }}</div>
              </div>
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.phone') }}</div>
                <div class="summary2-value">{{ model.phone }}</div>
              </div>
            </div>

            <div class="summary4-row">
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.region') }}</div>
                <div class="summary2-value">{{ model.region || '-' }}</div>
              </div>
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.province') }}</div>
                <div class="summary2-value">{{ model.province || '-' }}</div>
              </div>
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.city') }}</div>
                <div class="summary2-value">{{ model.city || '-' }}</div>
              </div>
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.address') }}</div>
                <div class="summary2-value">{{ model.address || '-' }}</div>
              </div>
            </div>

            <div class="summary4-row">
              <div class="summary4-col" style="grid-column: span 2;">
                <div class="summary2-label">{{ translate('structures.field.referenceContacts') }}</div>
                <div class="summary2-value">
                  <ng-container *ngFor="let ref of model.referents">
                    <div>{{ ref.firstName }} {{ ref.lastName }}<span *ngIf="ref.role"> - {{ ref.role }}</span></div>
                  </ng-container>
                </div>
              </div>
              <div class="summary4-col" style="grid-column: span 2;">
                <div class="summary2-label">{{ translate(isScheduleManagedStructure() ? 'structures.field.serviceCalendarHours' : 'structures.field.description') }}</div>
                <div class="summary2-value">
                  <ng-container *ngIf="isScheduleManagedStructure(); else genericSummaryValue">
                    <div *ngFor="let line of getSchedulePreviewLines()">{{ line }}</div>
                  </ng-container>
                  <ng-template #genericSummaryValue>
                    <div>{{ model.description || '-' }}</div>
                    <div style="margin-top: 0.5rem; font-weight: 600;">{{ translate('structures.field.active') }}: {{ translate(getActiveStatusLabelKey()) }}</div>
                  </ng-template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <div modal-actions>
        <button *ngIf="step > 1" class="btn btn-outline" (click)="prevStep()" type="button">{{ translate('crud.actions.back') }}</button>
        <button *ngIf="step > 1 && step < 4" class="btn btn-primary" (click)="nextStep()" type="button">{{ translate('crud.actions.next') }}</button>
        <button *ngIf="step === 4" class="btn btn-primary" (click)="save()" type="button">{{ translate(isEditMode() ? 'crud.actions.update' : 'structures.step.confirm') }}</button>
      </div>
    </qtm-step-modal>
  `,
  styleUrls: ['./add-wizard.component.css']
})
export class AddWizardComponentPharmacy implements OnInit, OnDestroy {
  @Input() structureId: number | null = null;
  @Input() structureType: ManagedStructureType = 'HOSPITAL_PHARMACY';
  @Output() close = new EventEmitter<void>();

  readonly defaultPhoneCountryIsoCode = 'it';
  readonly phoneCountryOrder: NonNullable<AllOptions['countryOrder']> = ['it', 'us', 'gb', 'fr', 'de', 'es'];
  readonly loadPhoneInputUtils = () => import('intl-tel-input/utils');

  @ViewChild('phoneInputElement')
  set phoneInputElement(ref: ElementRef<HTMLInputElement> | undefined) {
    const nextInput = ref?.nativeElement;
    if (this.phoneInputBinding?.input === nextInput) {
      return;
    }

    this.destroyPhoneInput();
    if (!nextInput) {
      return;
    }

    queueMicrotask(() => {
      if (this.phoneInputBinding?.input === nextInput) {
        return;
      }

      this.initializePhoneInput(nextInput);
    });
  }

  @ViewChild('referentPhoneInputElement')
  set referentPhoneInputElement(ref: ElementRef<HTMLInputElement> | undefined) {
    const nextInput = ref?.nativeElement;
    if (this.referentPhoneInputBinding?.input === nextInput) {
      return;
    }

    this.destroyReferentPhoneInput();
    if (!nextInput) {
      return;
    }

    queueMicrotask(() => {
      if (this.referentPhoneInputBinding?.input === nextInput) {
        return;
      }

      this.initializeReferentPhoneInput(nextInput);
    });
  }

  private phoneInputBinding?: {
    input: HTMLInputElement;
    iti: Iti;
    syncValue: () => void;
  };

  private referentPhoneInputBinding?: {
    input: HTMLInputElement;
    iti: Iti;
    syncValue: () => void;
  };

  showAddReferent = false;
  newReferent: Partial<ReferentDto> = { firstName: '', lastName: '', role: '', email: '', phone: '' };
  step = 1;
  regioni: GeographicOptionDto[] = [];
  province: GeographicOptionDto[] = [];
  comuni: GeographicOptionDto[] = [];
  loadingProvince = false;
  loadingComuni = false;
  stepTitles: string[] = [];
  stepDescriptions: string[] = [];
  referentsList: ReferentDto[] = [];
  parentStructures: ParentStructureOption[] = [];
  openingSchedule: PharmacyOpeningSlot[] = [this.createEmptyScheduleSlot()];

  readonly weekdays = [
    { code: 'MONDAY', labelKey: 'structures.schedule.day.monday' },
    { code: 'TUESDAY', labelKey: 'structures.schedule.day.tuesday' },
    { code: 'WEDNESDAY', labelKey: 'structures.schedule.day.wednesday' },
    { code: 'THURSDAY', labelKey: 'structures.schedule.day.thursday' },
    { code: 'FRIDAY', labelKey: 'structures.schedule.day.friday' },
    { code: 'SATURDAY', labelKey: 'structures.schedule.day.saturday' },
    { code: 'SUNDAY', labelKey: 'structures.schedule.day.sunday' }
  ] as const;

  readonly parentLabelKeys: Partial<Record<ManagedStructureType, string>> = {
    HOSPITAL_PHARMACY: 'structures.field.parentHospital',
    RETAIL_PHARMACY: 'structures.field.parentAsl',
    LOGISTICS_WAREHOUSE: 'structures.field.parentAsl',
    MATERIAL_WAREHOUSE: 'structures.field.parentAsl',
    SPECIALIST_CLINIC: 'structures.field.parentAsl'
  };

  readonly typeLabelKeys: Record<ManagedStructureType, string> = {
    HOSPITAL_PHARMACY: 'structures.type.hospitalPharmacy.label',
    RETAIL_PHARMACY: 'structures.type.retailPharmacy.label',
    LOGISTICS_WAREHOUSE: 'structures.type.logisticsWarehouse.label',
    MATERIAL_WAREHOUSE: 'structures.type.materialWarehouse.label',
    PHARMA_COMPANY: 'structures.type.pharmaCompany.label',
    SPECIALIST_CLINIC: 'structures.type.specialistClinic.label'
  };

  readonly wizardTitleKeys: Record<ManagedStructureType, string> = {
    HOSPITAL_PHARMACY: 'structures.wizard.hospitalPharmacy.title',
    RETAIL_PHARMACY: 'structures.wizard.retailPharmacy.title',
    LOGISTICS_WAREHOUSE: 'structures.wizard.logisticsWarehouse.title',
    MATERIAL_WAREHOUSE: 'structures.wizard.materialWarehouse.title',
    PHARMA_COMPANY: 'structures.wizard.pharmaCompany.title',
    SPECIALIST_CLINIC: 'structures.wizard.specialistClinic.title'
  };

  model: {
    id: number | null;
    name: string;
    code: string;
    description: string;
    regionId: string;
    region: string;
    provinceId: string;
    province: string;
    cityId: string;
    city: string;
    address: string;
    cap: string;
    phone: string;
    email: string;
    active: boolean;
    parentStructureId: number | null;
    parentStructureName: string;
    referents: ReferentDto[];
  } = {
    id: null,
    name: '',
    code: '',
    description: '',
    regionId: '',
    region: '',
    provinceId: '',
    province: '',
    cityId: '',
    city: '',
    address: '',
    cap: '',
    phone: '',
    email: '',
    active: true,
    parentStructureId: null,
    parentStructureName: '',
    referents: []
  };

  constructor(
    private readonly geoApi: GeographyApiService,
    private readonly referentApi: ReferentApiService,
    private readonly structureApi: StructureApiService,
    public readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.stepTitles = [
      'structures.step.generalData',
      'structures.step.contacts',
      'structures.step.specificData',
      'structures.step.confirm'
    ];
    this.stepDescriptions = [
      'structures.step.generalData.desc',
      'structures.step.contacts.desc',
      this.isScheduleManagedStructure() ? 'structures.step.specificData.pharmacy.desc' : 'structures.step.specificData.structure.desc',
      'structures.step.confirm.desc'
    ];

    this.loadRegioni();
    this.loadReferents();
    this.loadParentStructures();
    this.loadStructureForEdit();
  }

  ngOnDestroy(): void {
    this.destroyPhoneInput();
    this.destroyReferentPhoneInput();
  }

  translate(key: string): string {
    try {
      return t(key as never) || key;
    } catch {
      return key;
    }
  }

  isEditMode(): boolean {
    return typeof this.structureId === 'number';
  }

  compareReferentsById = (left: ReferentDto | null, right: ReferentDto | null): boolean => {
    return (left?.id ?? null) === (right?.id ?? null);
  };

  onPhoneModelChange(value: string): void {
    this.model = {
      ...this.model,
      phone: value
    };
    this.syncPhoneInputFromModel();
  }

  onReferentPhoneModelChange(value: string): void {
    this.newReferent = {
      ...this.newReferent,
      phone: value
    };
    this.syncReferentPhoneInputFromModel();
  }

  getWizardTitleKey(): string {
    return this.wizardTitleKeys[this.structureType];
  }

  getStructureTypeLabelKey(): string {
    return this.typeLabelKeys[this.structureType];
  }

  getParentLabelKey(): string {
    return this.parentLabelKeys[this.structureType] ?? 'structures.field.parentStructureId';
  }

  hasParentStructure(): boolean {
    return Boolean(this.parentLabelKeys[this.structureType]);
  }

  isScheduleManagedStructure(): boolean {
    return this.structureType === 'HOSPITAL_PHARMACY' || this.structureType === 'RETAIL_PHARMACY';
  }

  getActiveStatusLabelKey(): string {
    return this.model.active ? 'status.attivo' : 'status.inattivo';
  }

  addReferent(): void {
    if (!this.newReferent.firstName || !this.newReferent.lastName || !this.newReferent.email || !this.newReferent.phone) {
      return;
    }

    this.referentApi.create(this.newReferent as ReferentDto).subscribe({
      next: (created) => {
        this.referentsList = [...this.referentsList, created];
        this.model.referents = [...this.model.referents, created];
        this.newReferent = { firstName: '', lastName: '', role: '', email: '', phone: '' };
        this.showAddReferent = false;
      },
      error: () => {
        this.notificationService.showError(this.translate('referent.actions.addError'));
      }
    });
  }

  onRegioneChange(): void {
    this.model.region = this.findOptionName(this.regioni, this.model.regionId);
    this.model.provinceId = '';
    this.model.province = '';
    this.model.cityId = '';
    this.model.city = '';
    this.province = [];
    this.comuni = [];

    if (this.model.regionId) {
      this.loadProvinceOptions(this.model.regionId);
    }
  }

  onProvinciaChange(): void {
    this.model.province = this.findOptionName(this.province, this.model.provinceId);
    this.model.cityId = '';
    this.model.city = '';
    this.comuni = [];

    if (this.model.provinceId) {
      this.loadCityOptions(this.model.provinceId);
    }
  }

  onComuneChange(): void {
    this.model.city = this.findOptionName(this.comuni, this.model.cityId);
  }

  onParentStructureChange(): void {
    this.model.parentStructureName = this.findStructureName(this.parentStructures, this.model.parentStructureId);
  }

  addScheduleSlot(): void {
    this.openingSchedule = [...this.openingSchedule, this.createEmptyScheduleSlot()];
  }

  removeScheduleSlot(slotIndex: number): void {
    if (this.openingSchedule.length === 1) {
      this.openingSchedule = [this.createEmptyScheduleSlot()];
      return;
    }

    this.openingSchedule = this.openingSchedule.filter((_, index) => index !== slotIndex);
  }

  nextStep(): void {
    if (this.step === 3 && this.isScheduleManagedStructure() && !this.hasValidSchedule()) {
      this.notificationService.showError(this.translate('structures.message.scheduleRequired'));
      return;
    }

    if (this.step < 4) {
      this.step++;
    }
  }

  prevStep(): void {
    if (this.step > 1) {
      this.step--;
    }
  }

  save(): void {
    if (this.isScheduleManagedStructure() && !this.hasValidSchedule()) {
      this.notificationService.showError(this.translate('structures.message.scheduleRequired'));
      return;
    }

    const payload: StructureDto = {
      id: this.model.id ?? undefined,
      name: this.model.name,
      code: this.model.code,
      description: this.model.description,
      regionId: this.model.regionId,
      region: this.model.region,
      provinceId: this.model.provinceId,
      province: this.model.province,
      cityId: this.model.cityId,
      city: this.model.city,
      address: this.model.address,
      cap: this.model.cap,
      phone: this.model.phone,
      email: this.model.email,
      serviceCalendarHours: this.isScheduleManagedStructure() ? this.stringifySchedule() : undefined,
      active: this.model.active,
      parentStructureId: this.hasParentStructure() ? (this.model.parentStructureId ?? undefined) : undefined,
      parentStructureName: this.hasParentStructure() ? this.model.parentStructureName : undefined,
      referents: this.model.referents,
      structureType: this.structureType
    };

    const request = this.isEditMode() && this.structureId !== null
      ? this.structureApi.updateStructure(this.structureId, payload)
      : this.structureApi.createStructure(payload);

    request.subscribe({
      next: () => {
        this.notificationService.showSuccess(
          this.translate(this.isEditMode() ? 'crud.success.update' : 'crud.success.create')
        );
        this.close.emit();
      },
      error: () => {
        this.notificationService.showError(
          this.translate(this.isEditMode() ? 'crud.error.update' : 'crud.error.create')
        );
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  getSchedulePreviewLines(): string[] {
    return this.validScheduleSlots().map((slot) => {
      return `${this.translate(this.getWeekdayLabelKey(slot.dayOfWeek))}: ${slot.openingTime} - ${slot.closingTime}`;
    });
  }

  private loadParentStructures(): void {
    if (!this.hasParentStructure()) {
      this.parentStructures = [];
      return;
    }

    this.structureApi.getParentOptions(this.structureType).subscribe({
      next: (data) => {
        this.parentStructures = data;
        this.onParentStructureChange();
      },
      error: () => {
        this.parentStructures = [];
      }
    });
  }

  private loadReferents(): void {
    this.referentApi.getAll().subscribe({
      next: (data) => {
        this.referentsList = data;
        this.model.referents = this.mapReferentsById(this.model.referents);
      },
      error: () => {
        this.referentsList = [];
      }
    });
  }

  private loadRegioni(): void {
    this.geoApi.getRegions().subscribe({
      next: (data) => {
        this.regioni = data;
        if (this.model.regionId) {
          this.model.region = this.findOptionName(this.regioni, this.model.regionId);
        }
      },
      error: () => {
        this.regioni = [];
      }
    });
  }

  private loadStructureForEdit(): void {
    if (!this.isEditMode() || this.structureId === null) {
      return;
    }

    this.structureApi.getStructure(this.structureId).subscribe({
      next: (structure) => {
        this.model = {
          ...this.model,
          id: structure.id ?? null,
          name: structure.name ?? '',
          code: structure.code ?? '',
          description: structure.description ?? '',
          regionId: this.toSelectValue(structure.regionId),
          region: structure.region ?? '',
          provinceId: this.toSelectValue(structure.provinceId),
          province: structure.province ?? '',
          cityId: this.toSelectValue(structure.cityId),
          city: structure.city ?? '',
          address: structure.address ?? '',
          cap: structure.cap ?? '',
          phone: structure.phone ?? '',
          email: structure.email ?? '',
          active: structure.active ?? true,
          parentStructureId: this.hasParentStructure() ? (structure.parentStructureId ?? null) : null,
          parentStructureName: this.hasParentStructure() ? (structure.parentStructureName ?? '') : '',
          referents: this.mapReferentsById(structure.referents ?? [])
        };
        this.openingSchedule = this.isScheduleManagedStructure()
          ? this.parseSchedule(structure.serviceCalendarHours)
          : [this.createEmptyScheduleSlot()];

        if (this.model.regionId) {
          this.loadProvinceOptions(this.model.regionId, this.model.provinceId, this.model.cityId);
        }

        if (this.hasParentStructure()) {
          this.onParentStructureChange();
        }
      },
      error: () => {
        this.notificationService.showError(this.translate('crud.error.load'));
        this.close.emit();
      }
    });
  }

  private loadProvinceOptions(regionId: number | string, selectedProvinceId?: number | string, selectedCityId?: number | string): void {
    this.loadingProvince = true;
    this.geoApi.getProvincesByRegion(regionId).subscribe({
      next: (data) => {
        this.province = data;
        this.loadingProvince = false;

        if (selectedProvinceId) {
          this.model.provinceId = this.toSelectValue(selectedProvinceId);
          this.model.province = this.findOptionName(this.province, this.model.provinceId);
          this.loadCityOptions(selectedProvinceId, selectedCityId);
        }
      },
      error: () => {
        this.province = [];
        this.loadingProvince = false;
      }
    });
  }

  private loadCityOptions(provinceId: number | string, selectedCityId?: number | string): void {
    this.loadingComuni = true;
    this.geoApi.getCitiesByProvince(provinceId).subscribe({
      next: (data) => {
        this.comuni = data;
        this.loadingComuni = false;

        if (selectedCityId) {
          this.model.cityId = this.toSelectValue(selectedCityId);
          this.model.city = this.findOptionName(this.comuni, this.model.cityId);
        }
      },
      error: () => {
        this.comuni = [];
        this.loadingComuni = false;
      }
    });
  }

  private hasValidSchedule(): boolean {
    return this.validScheduleSlots().length > 0;
  }

  private validScheduleSlots(): PharmacyOpeningSlot[] {
    return this.openingSchedule.filter((slot) => {
      return Boolean(slot.dayOfWeek && slot.openingTime && slot.closingTime);
    });
  }

  private stringifySchedule(): string {
    return JSON.stringify(this.validScheduleSlots());
  }

  private parseSchedule(serializedSchedule?: string): PharmacyOpeningSlot[] {
    if (!serializedSchedule || serializedSchedule.trim().length === 0) {
      return [this.createEmptyScheduleSlot()];
    }

    try {
      const parsed = JSON.parse(serializedSchedule);
      if (!Array.isArray(parsed)) {
        return [this.createEmptyScheduleSlot()];
      }

      const slots = parsed
        .filter((slot): slot is PharmacyOpeningSlot => {
          return typeof slot?.dayOfWeek === 'string'
            && typeof slot?.openingTime === 'string'
            && typeof slot?.closingTime === 'string';
        })
        .map((slot) => ({
          dayOfWeek: slot.dayOfWeek,
          openingTime: slot.openingTime,
          closingTime: slot.closingTime
        }));

      return slots.length > 0 ? slots : [this.createEmptyScheduleSlot()];
    } catch {
      return [this.createEmptyScheduleSlot()];
    }
  }

  private createEmptyScheduleSlot(): PharmacyOpeningSlot {
    return {
      dayOfWeek: '',
      openingTime: '',
      closingTime: ''
    };
  }

  private getWeekdayLabelKey(dayOfWeek: string): string {
    return this.weekdays.find((weekday) => weekday.code === dayOfWeek)?.labelKey ?? dayOfWeek;
  }

  private findOptionName(options: GeographicOptionDto[], optionId?: number | string | null): string {
    if (typeof optionId !== 'number' && typeof optionId !== 'string') {
      return '';
    }

    const idNum = typeof optionId === 'string' ? parseInt(optionId, 10) : optionId;
    return options.find((option) => option.id === idNum)?.name ?? '';
  }

  private findStructureName(options: ParentStructureOption[], structureId: number | null): string {
    if (structureId === null) {
      return '';
    }

    const selectedStructure = options.find((option) => option.id === structureId);
    return selectedStructure?.selectionLabel ?? selectedStructure?.name ?? this.model.parentStructureName;
  }

  private mapReferentsById(referents: ReferentDto[]): ReferentDto[] {
    if (this.referentsList.length === 0) {
      return referents;
    }

    return referents.map((referent) => {
      return this.referentsList.find((candidate) => candidate.id === referent.id) ?? referent;
    });
  }

  private toSelectValue(optionId?: number | string | null): string {
    if (optionId === null || optionId === undefined || optionId === '') {
      return '';
    }

    return String(optionId);
  }

  private initializePhoneInput(input: HTMLInputElement): void {
    const iti = intlTelInput(input, {
      containerClass: 'phone-intl-input',
      countryOrder: this.phoneCountryOrder,
      initialCountry: this.defaultPhoneCountryIsoCode,
      loadUtils: this.loadPhoneInputUtils,
      strictMode: false,
      useFullscreenPopup: false
    });

    const syncValue = () => this.updatePhoneFromInput(input, iti);
    input.addEventListener('input', syncValue);
    input.addEventListener('countrychange', syncValue);

    this.phoneInputBinding = {
      input,
      iti,
      syncValue
    };

    iti.promise.then(() => {
      if (!iti.isActive() || this.phoneInputBinding?.input !== input) {
        return;
      }

      this.syncPhoneInputFromModel();
      this.updatePhoneFromInput(input, iti);
    });
  }

  private destroyPhoneInput(): void {
    if (!this.phoneInputBinding) {
      return;
    }

    const { input, iti, syncValue } = this.phoneInputBinding;
    input.removeEventListener('input', syncValue);
    input.removeEventListener('countrychange', syncValue);
    iti.destroy();
    this.phoneInputBinding = undefined;
  }

  private syncPhoneInputFromModel(): void {
    const binding = this.phoneInputBinding;
    if (!binding) {
      return;
    }

    const modelValue = this.asPhoneString(this.model.phone);
    const currentValue = binding.iti.getNumber() || binding.input.value;
    if (modelValue !== currentValue) {
      binding.iti.setNumber(modelValue);
    }
  }

  private updatePhoneFromInput(input: HTMLInputElement, iti: Iti): void {
    const nextValue = iti.getNumber() || this.asPhoneString(input.value);
    if (this.model.phone === nextValue) {
      return;
    }

    this.model = {
      ...this.model,
      phone: nextValue
    };
  }

  private initializeReferentPhoneInput(input: HTMLInputElement): void {
    const iti = intlTelInput(input, {
      containerClass: 'phone-intl-input',
      countryOrder: this.phoneCountryOrder,
      initialCountry: this.defaultPhoneCountryIsoCode,
      loadUtils: this.loadPhoneInputUtils,
      nationalMode: true,
      separateDialCode: true
    });

    const syncValue = () => this.updateReferentPhoneFromInput(input, iti);
    input.addEventListener('input', syncValue);
    input.addEventListener('countrychange', syncValue);
    input.addEventListener('blur', syncValue);

    this.referentPhoneInputBinding = {
      input,
      iti,
      syncValue
    };

    iti.promise.then(() => {
      if (!iti.isActive() || this.referentPhoneInputBinding?.input !== input) {
        return;
      }

      this.syncReferentPhoneInputFromModel();
      this.updateReferentPhoneFromInput(input, iti);
    });
  }

  private destroyReferentPhoneInput(): void {
    if (!this.referentPhoneInputBinding) {
      return;
    }

    const { input, iti, syncValue } = this.referentPhoneInputBinding;
    input.removeEventListener('input', syncValue);
    input.removeEventListener('countrychange', syncValue);
    input.removeEventListener('blur', syncValue);
    iti.destroy();
    this.referentPhoneInputBinding = undefined;
  }

  private syncReferentPhoneInputFromModel(): void {
    const binding = this.referentPhoneInputBinding;
    if (!binding || document.activeElement === binding.input) {
      return;
    }

    const modelValue = this.asPhoneString(this.newReferent.phone);
    const currentValue = binding.iti.getNumber() || binding.input.value;
    if (modelValue !== currentValue) {
      binding.iti.setNumber(modelValue);
    }
  }

  private updateReferentPhoneFromInput(input: HTMLInputElement, iti: Iti): void {
    const nextValue = iti.getNumber() || this.asPhoneString(input.value);
    if (this.newReferent.phone === nextValue) {
      return;
    }

    this.newReferent = {
      ...this.newReferent,
      phone: nextValue
    };
  }

  private asPhoneString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}