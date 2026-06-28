import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import intlTelInput, { type AllOptions, type Iti } from 'intl-tel-input';
import { GeographyApiService, GeographicOptionDto } from '../core/geography-api.service';
import { PharmacyApiService, DepartmentDto } from '../core/pharmacy-api.service';
import { ReferentApiService, ReferentDto } from '../core/referent-api.service';
import { StructureApiService, StructureDto } from '../core/structure-api.service';
import { t } from '../i18n/messages';
import { NotificationService } from './notification.service';
import { QtmStepModalComponent } from './qtm-step-modal.component';

/**
 * Wizard popup per inserimento e modifica di strutture ospedaliere.
 */
@Component({
  selector: 'add-wizard-component-hospital',
  standalone: true,
  imports: [CommonModule, FormsModule, QtmStepModalComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <qtm-step-modal
      [title]="translate('structures.wizard.hospital.title')"
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
              <div style="margin-top:8px;font-weight:600;color:#1890ff;">{{ translate('structures.type.hospital.label') }}</div>
            </label>
          </div>

          <div class="form-row">
            <label>{{ translate('structures.field.parentAsl') }}<span class="required-asterisk">*</span>
              <select class="search-filter-select" name="parentStructureId" [(ngModel)]="model.parentStructureId" (ngModelChange)="onParentAslChange()" required>
                <option [ngValue]="null">{{ translate('structures.select') }}</option>
                <option *ngFor="let asl of aslStructures" [ngValue]="asl.id">{{ asl.selectionLabel || asl.name }}</option>
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

          <div class="form-row">
            <label>{{ translate('structures.field.googleAddress') }}
              <gmpx-place-autocomplete
                style="width:100%"
                input-attr="{name: 'googleAddress', required: true, autocomplete: 'off'}"
                (gmpxPlaceSelect)="onPlaceSelected($event)"
              ></gmpx-place-autocomplete>
            </label>
          </div>

          <div class="form-row" style="justify-content: flex-end;">
            <button class="btn btn-primary" type="submit" [disabled]="!form1.valid">{{ translate('crud.actions.next') }}</button>
          </div>
        </form>

        <form *ngSwitchCase="2" (ngSubmit)="nextStep()" #form2="ngForm">
          <h4>{{ translate('structures.step.contacts') }}</h4>
          <div class="form-row referent-toolbar-row">
            <label class="referent-picker-field">{{ translate('structures.field.referents') }}
              <select class="crud-input referent-picker-select" name="referents" [(ngModel)]="model.referents" [compareWith]="compareReferentsById" multiple required>
                <option *ngFor="let ref of referentsList" [ngValue]="ref">{{ ref.firstName }} {{ ref.lastName }} ({{ ref.role }})</option>
              </select>
            </label>
            <button type="button" class="btn btn-secondary referent-toggle-button" (click)="showAddReferent = !showAddReferent">{{ translate('referent.actions.add') }}</button>
          </div>
          <div class="referent-editor-shell" *ngIf="showAddReferent">
            <div class="referent-editor-form">
              <input name="firstName" [(ngModel)]="newReferent.firstName" required placeholder="{{ translate('referent.field.firstName') }}" class="crud-input referent-editor-input" />
              <input name="lastName" [(ngModel)]="newReferent.lastName" required placeholder="{{ translate('referent.field.lastName') }}" class="crud-input referent-editor-input" />
              <input name="role" [(ngModel)]="newReferent.role" placeholder="{{ translate('referent.field.role') }}" class="crud-input referent-editor-input" />
              <input name="email" [(ngModel)]="newReferent.email" required placeholder="{{ translate('referent.field.email') }}" class="crud-input referent-editor-input referent-editor-input-email" type="email" />
              <div class="phone-input-group phone-input-group-intl referent-editor-phone-wrap">
                <input #referentPhoneInputElement name="phone" [ngModel]="newReferent.phone" (ngModelChange)="onReferentPhoneModelChange($event)" required placeholder="{{ translate('referent.field.phone') }}" class="crud-input referent-editor-input referent-editor-input-phone phone-number-input" type="tel" inputmode="tel" />
              </div>
              <div class="referent-editor-actions">
                <button type="button" class="btn btn-primary" (click)="addReferent()" [disabled]="!newReferent.firstName || !newReferent.lastName || !newReferent.email || !newReferent.phone">{{ translate('referent.actions.save') }}</button>
                <button type="button" class="btn btn-outline" (click)="showAddReferent = false">{{ translate('crud.actions.cancel') }}</button>
              </div>
            </div>
          </div>
        </form>

        <div *ngSwitchCase="3">
          <h4>{{ translate('structures.step.specificData') }}</h4>
          <div class="pharmacy-selection-list">
            <div class="pharmacy-card" *ngFor="let group of groupedDepartmentsList; trackBy: trackByArea">
              <div class="pharmacy-card-title" style="margin-bottom: 12px;">{{ group.area }}</div>
              <label class="pharmacy-card" *ngFor="let department of group.departments; trackBy: trackByDepartmentId" style="margin-bottom: 12px;">
                <div class="pharmacy-card-header">
                <input
                  type="checkbox"
                  [checked]="isDepartmentSelected(department.id)"
                  (change)="toggleDepartmentSelection(department.id, $any($event.target).checked)"
                />
                <div class="pharmacy-card-main">
                  <div class="pharmacy-card-title">{{ department.reparto }}</div>
                  <div class="pharmacy-card-meta">
                    {{ group.area || '-' }}
                  </div>
                </div>
              </div>
                <div class="pharmacy-card-detail-label">{{ translate('structures.field.referents') }}</div>
                <div class="pharmacy-card-detail">
                  <select
                    *ngIf="isDepartmentSelected(department.id)"
                    [ngModel]="getDepartmentReferentId(department.id)"
                    (ngModelChange)="setDepartmentReferent(department.id, $event)"
                  >
                    <option [ngValue]="undefined">-</option>
                    <option *ngFor="let ref of referentsList" [ngValue]="ref.id">{{ ref.firstName }} {{ ref.lastName }}<span *ngIf="ref.role"> ({{ ref.role }})</span></option>
                  </select>
                </div>
              </label>
            </div>
          </div>
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
                <div class="summary2-label">{{ translate('structures.field.parentAsl') }}</div>
                <div class="summary2-value">{{ model.parentStructureName || '-' }}</div>
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
                <div class="summary2-label">{{ translate('structures.field.departments') }}</div>
                <div class="summary2-value">
                  <div *ngFor="let selection of model.departmentsSelected" class="summary-pharmacy-row">
                    <strong>{{ findDepartmentName(selection.departmentId) }}</strong>
                    <span> - {{ findDepartmentArea(selection.departmentId) }}</span>
                    <ng-container *ngIf="selection.referentId as referentId">
                      <div>{{ findReferentName(referentId) }}</div>
                      <div *ngIf="findReferentEmail(referentId)">{{ translate('referent.field.email') }}: {{ findReferentEmail(referentId) }}</div>
                      <div *ngIf="findReferentPhone(referentId)">{{ translate('referent.field.phone') }}: {{ findReferentPhone(referentId) }}</div>
                    </ng-container>
                  </div>
                </div>
              </div>
              <div class="summary4-col" style="grid-column: span 2;">
                <div class="summary2-label">{{ translate('structures.field.referenceContacts') }}</div>
                <div class="summary2-value">
                  <ng-container *ngFor="let ref of model.referents">
                    <div class="summary-pharmacy-row">
                      <div>{{ ref.firstName }} {{ ref.lastName }}<span *ngIf="ref.role"> - {{ ref.role }}</span></div>
                      <div *ngIf="ref.email">{{ translate('referent.field.email') }}: {{ ref.email }}</div>
                      <div *ngIf="ref.phone">{{ translate('referent.field.phone') }}: {{ ref.phone }}</div>
                    </div>
                  </ng-container>
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
export class AddWizardComponentHospital implements OnInit, OnDestroy {
  @Input() structureId: number | null = null;
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
  errorMessage = '';
  regioni: GeographicOptionDto[] = [];
  province: GeographicOptionDto[] = [];
  comuni: GeographicOptionDto[] = [];
  loadingProvince = false;
  loadingComuni = false;
  stepTitles: string[] = [];
  stepDescriptions: string[] = [];
  referentsList: ReferentDto[] = [];
  aslStructures: StructureDto[] = [];
  departmentsList: DepartmentDto[] = [];
  groupedDepartmentsList: Array<{ area: string; departments: DepartmentDto[] }> = [];

  model: {
    id: number | null;
    name: string;
    code: string;
    regionId: string;
    region: string;
    provinceId: string;
    province: string;
    cityId: string;
    city: string;
    address: string;
    cap: string;
    phone: string;
    description: string;
    email: string;
    active: boolean;
    parentStructureId: number | null;
    parentStructureName: string;
    referents: ReferentDto[];
    departmentsSelected: Array<{ departmentId: number; referentId?: number }>;
    structureType: string;
    googleAddress: string;
  } = {
    id: null,
    name: '',
    code: '',
    regionId: '',
    region: '',
    provinceId: '',
    province: '',
    cityId: '',
    city: '',
    address: '',
    cap: '',
    phone: '',
    description: '',
    email: '',
    active: true,
    parentStructureId: null,
    parentStructureName: '',
    referents: [],
    departmentsSelected: [],
    structureType: 'HOSPITAL',
    googleAddress: ''
  };

  constructor(
    private readonly geoApi: GeographyApiService,
    private readonly referentApi: ReferentApiService,
    private readonly pharmacyApi: PharmacyApiService,
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
      'structures.step.specificData.hospital.desc',
      'structures.step.confirm.desc'
    ];

    this.loadRegioni();
    this.loadReferents();
    this.loadAslStructures();
    this.loadDepartments();
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

  addReferent(): void {
    if (!this.newReferent.firstName || !this.newReferent.lastName || !this.newReferent.email || !this.newReferent.phone) {
      return;
    }

    this.referentApi.create(this.newReferent as ReferentDto).subscribe({
      next: (created) => {
        this.referentsList = [...this.referentsList, created];
        this.model.referents = [...(this.model.referents || []), created];
        this.resetNewReferent();
        this.showAddReferent = false;
      },
      error: () => {
        this.notificationService.showError(this.translate('referent.actions.addError'));
      }
    });
  }

  onPhoneModelChange(value: string): void {
    this.model.phone = value;
    this.syncPhoneInputFromModel();
  }

  onReferentPhoneModelChange(value: string): void {
    this.newReferent = {
      ...this.newReferent,
      phone: value
    };
    this.syncReferentPhoneInputFromModel();
  }

  onPlaceSelected(event: Event): void {
    const placeEvent = event as Event & { place?: { formattedAddress?: string } };
    this.model.googleAddress = placeEvent.place?.formattedAddress || '';
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

  onParentAslChange(): void {
    this.model.parentStructureName = this.findStructureName(this.aslStructures, this.model.parentStructureId);

    const selectedAsl = this.aslStructures.find((s) => s.id === this.model.parentStructureId) ?? null;

    if (selectedAsl) {
      // Prefill geographic fields from selected ASL (editable by user)
      this.model.regionId = this.toSelectValue(selectedAsl.regionId);
      this.model.region = selectedAsl.region ?? '';

      this.model.provinceId = this.toSelectValue(selectedAsl.provinceId);
      this.model.province = selectedAsl.province ?? '';

      this.model.cityId = this.toSelectValue(selectedAsl.cityId);
      this.model.city = selectedAsl.city ?? '';

      // Load dependent lists (provinces/comuni) so selects show the correct options
      if (this.model.regionId) {
        this.loadProvinceOptions(this.model.regionId, this.model.provinceId, this.model.cityId);
      } else {
        this.province = [];
        this.comuni = [];
      }

      // Prefill address/zip/phone if available
      this.model.address = selectedAsl.address ?? this.model.address;
      this.model.cap = selectedAsl.cap ?? this.model.cap;
      this.model.phone = selectedAsl.phone ?? this.model.phone;
    } else {
      // If no ASL selected, clear prefilled geographic fields but keep user-entered values empty
      this.model.regionId = '';
      this.model.region = '';
      this.model.provinceId = '';
      this.model.province = '';
      this.model.cityId = '';
      this.model.city = '';
      this.province = [];
      this.comuni = [];
    }
  }

  nextStep(): void {
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
    const payload: StructureDto = {
      id: this.model.id ?? undefined,
      name: this.model.name,
      code: this.model.code,
      regionId: this.model.regionId,
      region: this.model.region,
      provinceId: this.model.provinceId,
      province: this.model.province,
      cityId: this.model.cityId,
      city: this.model.city,
      address: this.model.address,
      cap: this.model.cap,
      phone: this.model.phone,
      description: this.model.description,
      email: this.model.email,
      active: this.model.active,
      parentStructureId: this.model.parentStructureId ?? undefined,
      parentStructureName: this.model.parentStructureName,
      referents: this.model.referents,
      departmentsSelected: this.model.departmentsSelected,
      structureType: 'HOSPITAL'
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

  isDepartmentSelected(departmentId: number): boolean {
    return this.model.departmentsSelected.some((item) => item.departmentId === departmentId);
  }

  toggleDepartmentSelection(departmentId: number, checked: boolean): void {
    if (checked) {
      if (!this.isDepartmentSelected(departmentId)) {
        this.model.departmentsSelected = [...this.model.departmentsSelected, { departmentId }];
      }
      return;
    }

    this.model.departmentsSelected = this.model.departmentsSelected.filter((item) => item.departmentId !== departmentId);
  }

  getDepartmentReferentId(departmentId: number): number | undefined {
    return this.model.departmentsSelected.find((item) => item.departmentId === departmentId)?.referentId;
  }

  setDepartmentReferent(departmentId: number, referentId?: number): void {
    this.model.departmentsSelected = this.model.departmentsSelected.map((item) =>
      item.departmentId === departmentId ? { ...item, referentId: referentId ?? undefined } : item
    );
  }

  trackByArea(_index: number, group: { area: string }): string {
    return group.area;
  }

  trackByDepartmentId(_index: number, department: DepartmentDto): number {
    return department.id;
  }

  private buildGroupedDepartments(departments: DepartmentDto[]): Array<{ area: string; departments: DepartmentDto[] }> {
    const groups = new Map<string, DepartmentDto[]>();
    for (const department of departments) {
      const key = department.areaFunzionale?.trim() || 'Altri';
      const current = groups.get(key) ?? [];
      current.push(department);
      groups.set(key, current);
    }

    return Array.from(groups.entries())
      .map(([area, departments]) => ({ area, departments }))
      .sort((left, right) => left.area.localeCompare(right.area));
  }

  findDepartmentName(departmentId: number): string {
    return this.departmentsList.find((item) => item.id === departmentId)?.reparto ?? String(departmentId);
  }

  findDepartmentArea(departmentId: number): string {
    return this.departmentsList.find((item) => item.id === departmentId)?.areaFunzionale ?? '-';
  }

  findReferentName(referentId: number): string {
    const referent = this.findReferent(referentId);
    return referent ? `${referent.firstName} ${referent.lastName}` : String(referentId);
  }

  findReferentEmail(referentId: number): string {
    return this.findReferent(referentId)?.email ?? '';
  }

  findReferentPhone(referentId: number): string {
    return this.findReferent(referentId)?.phone ?? '';
  }

  private loadDepartments(): void {
    this.pharmacyApi.getDepartments().subscribe({
      next: (data) => {
        this.departmentsList = data;
        this.groupedDepartmentsList = this.buildGroupedDepartments(data);
      },
      error: () => {
        this.departmentsList = [];
        this.groupedDepartmentsList = [];
      }
    });
  }

  private findReferent(referentId: number): ReferentDto | undefined {
    return this.referentsList.find((item) => item.id === referentId);
  }

  private loadAslStructures(): void {
    this.structureApi.getStructuresByType('ASL', true).subscribe({
      next: (data) => {
        this.aslStructures = data;
        this.onParentAslChange();
      },
      error: () => {
        this.aslStructures = [];
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
          regionId: this.toSelectValue(structure.regionId),
          region: structure.region ?? '',
          provinceId: this.toSelectValue(structure.provinceId),
          province: structure.province ?? '',
          cityId: this.toSelectValue(structure.cityId),
          city: structure.city ?? '',
          address: structure.address ?? '',
          cap: structure.cap ?? '',
          phone: structure.phone ?? '',
          description: structure.description ?? '',
          email: structure.email ?? '',
          active: structure.active ?? true,
          parentStructureId: structure.parentStructureId ?? null,
          parentStructureName: structure.parentStructureName ?? '',
          referents: this.mapReferentsById(structure.referents ?? []),
          departmentsSelected: structure.departmentsSelected ?? [],
          structureType: structure.structureType ?? 'HOSPITAL'
        };

        if (this.model.regionId) {
          this.loadProvinceOptions(this.model.regionId, this.model.provinceId, this.model.cityId);
        }

        this.onParentAslChange();
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

  private findOptionName(options: GeographicOptionDto[], optionId?: number | string | null): string {
    if (typeof optionId !== 'number' && typeof optionId !== 'string') {
      return '';
    }

    const idNum = typeof optionId === 'string' ? parseInt(optionId, 10) : optionId;
    return options.find((option) => option.id === idNum)?.name ?? '';
  }

  private findStructureName(options: StructureDto[], structureId: number | null): string {
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

    this.model.phone = nextValue;
  }

  private asPhoneString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
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

  private resetNewReferent(): void {
    this.newReferent = { firstName: '', lastName: '', role: '', email: '', phone: '' };
    this.syncReferentPhoneInputFromModel();
  }
}