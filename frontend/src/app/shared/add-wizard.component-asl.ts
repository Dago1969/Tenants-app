import { t } from '../i18n/messages';
import { Component, OnDestroy, OnInit, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA, Input, ElementRef, ViewChild } from '@angular/core';
// import già presente, rimosso duplicato
import { GeographyApiService, GeographicOptionDto } from '../core/geography-api.service';
import { ReferentApiService, ReferentDto } from '../core/referent-api.service';
import { PharmacyApiService, PharmacyDto } from '../core/pharmacy-api.service';
import { StructureApiService, StructureDto } from '../core/structure-api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import intlTelInput, { type AllOptions, type Iti } from 'intl-tel-input';
import { QtmStepModalComponent } from './qtm-step-modal.component';
import { NotificationService } from './notification.service';

/**
 * Wizard ASL riutilizzato sia per l'inserimento sia per la modifica di una struttura esistente.
 */
@Component({
  selector: 'add-wizard-component-asl',
  standalone: true,
  imports: [CommonModule, FormsModule, QtmStepModalComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <qtm-step-modal
      [title]="translate('structures.wizard.title')"
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
            <label>{{ translate('structures.field.codice') }}<span class="required-asterisk">*</span><input type="text" name="code" [(ngModel)]="model.code" required /></label>
            <label>{{ translate('structures.field.structureType') }}<span class="required-asterisk">*</span>
              <div style="margin-top:8px;font-weight:600;color:#1890ff;">ASL</div>
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

        <form *ngSwitchCase="3" (ngSubmit)="nextStep()" #form3="ngForm">
          <h4>{{ translate('structures.step.specificData') }}</h4>
          <div class="form-row">
            <label>{{ translate('structures.field.hospitalPharmacy') }}
              <select name="hospitalPharmacy" [(ngModel)]="model.hospitalPharmacyIds" multiple required style="min-width:300px; min-height: 80px;">
                <option *ngFor="let pharmacy of hospitalPharmaciesList" [ngValue]="pharmacy.id">{{ pharmacy.name }} ({{ pharmacy.city }})</option>
              </select>
            </label>
          </div>
        </form>

        <div *ngSwitchCase="4">
          <h4>{{ translate('structures.step.summary') }}</h4>
          <div class="summary4-grid">
            <div class="summary4-row">
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.denom') }}</div>
                <div class="summary2-value">{{ model.name }}</div>
              </div>
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.aslReference') }}</div>
                <div class="summary2-value">{{ model.code }}</div>
              </div>
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.phone') }}</div>
                <div class="summary2-value">{{ model.phone }}</div>
              </div>
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.address') }}</div>
                <div class="summary2-value">{{ model.address }}</div>
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
            </div>

            <div class="summary4-row">
              <div class="summary4-col" style="grid-column: span 2;">
                <div class="summary2-label">{{ translate('structures.field.referencePharmacies') }}</div>
                <div class="summary2-value">
                  <ng-container *ngFor="let pharmacy of hospitalPharmaciesList">
                    <span *ngIf="model.hospitalPharmacyIds && model.hospitalPharmacyIds.includes(pharmacy.id)">{{ pharmacy.name }} - {{ pharmacy.city }}<br></span>
                  </ng-container>
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

      <div modal-actions *ngIf="!showSuccessPopup">
        <button *ngIf="step > 1" class="btn btn-outline" (click)="prevStep()" type="button">{{ translate('crud.actions.back') }}</button>
        <button *ngIf="step > 1 && step < 4" class="btn btn-primary" (click)="nextStep()" type="button">{{ translate('crud.actions.next') }}</button>
        <button *ngIf="step === 4" class="btn btn-primary" (click)="save()" type="button">{{ translate(isEditMode() ? 'crud.actions.update' : 'structures.step.confirm') }}</button>
      </div>
    </qtm-step-modal>
  `,
  styleUrls: ['./add-wizard.component.css']
})
export class AddWizardComponentAsl implements OnInit, OnDestroy {
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
    private phoneInputBinding?: {
      input: HTMLInputElement;
      iti: Iti;
      syncValue: () => void;
    };
    showAddReferent = false;
    newReferent: Partial<import('../core/referent-api.service').ReferentDto> = { firstName: '', lastName: '', role: '', email: '', phone: '' };
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
    private referentPhoneInputBinding?: {
      input: HTMLInputElement;
      iti: Iti;
      syncValue: () => void;
    };

    /**
     * Aggiunge un nuovo referente tramite API e aggiorna la lista referenti selezionando quello appena creato.
     */
    addReferent() {
      if (!this.newReferent.firstName || !this.newReferent.lastName || !this.newReferent.email || !this.newReferent.phone) return;
      this.referentApi.create(this.newReferent as import('../core/referent-api.service').ReferentDto).subscribe({
        next: (created) => {
          this.referentsList = [...this.referentsList, created];
          this.model.referents = [...(this.model.referents || []), created];
          this.resetNewReferent();
          this.showAddReferent = false;
        },
        error: () => {
          // Notifica errore
          this.notificationService.showError(this.translate('referent.actions.addError'));
        }
      });
    }
  @Input() structureId: number | null = null;
  @Output() close = new EventEmitter<void>();

  step = 1;
  showSuccessPopup = false;
  errorMessage = '';
  regioni: GeographicOptionDto[] = [];
  province: GeographicOptionDto[] = [];
  comuni: GeographicOptionDto[] = [];
  loadingRegioni = false;
  loadingProvince = false;
  loadingComuni = false;
  stepTitles: string[] = [];
  stepDescriptions: string[] = [];
  hospitalPharmaciesList: PharmacyDto[] = [];
  referentsList: ReferentDto[] = [];

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
    referents: ReferentDto[];
    hospitalPharmacyIds: number[];
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
    referents: [],
    hospitalPharmacyIds: [],
    structureType: 'ASL',
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
      'structures.step.specificData.desc',
      'structures.step.confirm.desc'
    ];

    this.loadRegioni();
    this.loadReferents();
    this.loadHospitalPharmacies();
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

  onPlaceSelected(event: Event): void {
    const placeEvent = event as Event & { place?: { formattedAddress?: string } };
    this.model.googleAddress = placeEvent.place?.formattedAddress || '';
  }

  loadHospitalPharmacies(): void {
    this.pharmacyApi.getActiveHospitalPharmacies().subscribe({
      next: (data) => {
        this.hospitalPharmaciesList = data;
      },
      error: () => {
        this.hospitalPharmaciesList = [];
      }
    });
  }

  loadReferents(): void {
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

  loadRegioni(): void {
    this.loadingRegioni = true;
    this.geoApi.getRegions().subscribe({
      next: (data) => {
        this.regioni = data;
        this.loadingRegioni = false;
      },
      error: () => {
        this.regioni = [];
        this.loadingRegioni = false;
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
      referents: this.model.referents,
      hospitalPharmacyIds: this.model.hospitalPharmacyIds,
      pharmacies: this.toSelectedPharmacies(),
      structureType: 'ASL'
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
          referents: this.mapReferentsById(structure.referents ?? []),
          hospitalPharmacyIds: (structure.pharmacies ?? [])
            .map((pharmacy) => pharmacy.id)
            .filter((pharmacyId): pharmacyId is number => typeof pharmacyId === 'number'),
          structureType: structure.structureType ?? 'ASL'
        };

        if (this.model.regionId) {
          this.loadProvinceOptions(this.model.regionId, this.model.provinceId, this.model.cityId);
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

  private findOptionName(options: GeographicOptionDto[], optionId?: number | string | null): string {
    if (typeof optionId !== 'number' && typeof optionId !== 'string') {
      return '';
    }

    const idNum = typeof optionId === 'string' ? parseInt(optionId, 10) : optionId;
    return options.find((option) => option.id === idNum)?.name ?? '';
  }

  private mapReferentsById(referents: ReferentDto[]): ReferentDto[] {
    if (this.referentsList.length === 0) {
      return referents;
    }

    return referents.map((referent) => {
      return this.referentsList.find((candidate) => candidate.id === referent.id) ?? referent;
    });
  }

  private toSelectedPharmacies(): Array<{ id?: number }> {
    return (this.model.hospitalPharmacyIds ?? [])
      .map((pharmacyId) => Number(pharmacyId))
      .filter((pharmacyId) => !Number.isNaN(pharmacyId))
      .map((pharmacyId) => ({ id: pharmacyId }));
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

  private resetNewReferent(): void {
    this.newReferent = { firstName: '', lastName: '', role: '', email: '', phone: '' };
    this.syncReferentPhoneInputFromModel();
  }
}
