import { t } from '../i18n/messages';
import { Component, OnInit, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { GeographyApiService, GeographicOptionDto } from '../core/geography-api.service';
import { ReferentApiService, ReferentDto } from '../core/referent-api.service';
import { PharmacyApiService, PharmacyDto } from '../core/pharmacy-api.service';
import { StructureApiService, StructureDto } from '../core/structure-api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QtmStepModalComponent } from './qtm-step-modal.component';

/**
 * Wizard inserimento ASL in 4 step
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
      [stepTitle]="translate(stepTitles[step-1])"
      [stepDescription]="translate(stepDescriptions[step-1])"
      (close)="onClose()"
    >
      <div *ngIf="showSuccessPopup" class="success-popup">
        <div class="success-popup-content">
          <div class="success-icon">✔️</div>
          <div class="success-message">
            <b>{{ translate('structures.success.title') }}</b><br>
            <span *ngFor="let line of translate('structures.success.body').split('\\n')">{{line}}<br></span>
          </div>
          <button class="btn btn-primary" (click)="onClose()">{{ translate('structures.success.close') }}</button>
        </div>
      </div>
      <div *ngIf="errorMessage && !showSuccessPopup" class="error-message">{{errorMessage}}</div>
      <ng-container *ngIf="!showSuccessPopup" [ngSwitch]="step">
        <form *ngSwitchCase="1" (ngSubmit)="nextStep()" #form1="ngForm">
          <!-- Step 1: Dati anagrafici -->
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
                <option *ngFor="let regione of regioni" [value]="regione.id">{{regione.name}}</option>
              </select>
            </label>
            <label>{{ translate('structures.field.provincia') }}<span class="required-asterisk">*</span>
              <select class="search-filter-select" name="provinceId" [(ngModel)]="model.provinceId" (change)="onProvinciaChange()" [disabled]="!province.length" required>
                <option value="">{{ translate('structures.select') }}</option>
                <option *ngFor="let provincia of province" [value]="provincia.id">{{provincia.name}}</option>
              </select>
            </label>
            <label>{{ translate('structures.field.comune') }}<span class="required-asterisk">*</span>
              <select class="search-filter-select" name="cityId" [(ngModel)]="model.cityId" (change)="onComuneChange()" [disabled]="!comuni.length" required>
                <option value="">{{ translate('structures.select') }}</option>
                <option *ngFor="let comune of comuni" [value]="comune.id">{{comune.name}}</option>
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
              <input type="text" name="phone" [(ngModel)]="model.phone" required autocomplete="off" />
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
            <button class="btn btn-primary" type="submit" [disabled]="!form1.valid">Avanti</button>
          </div>
        </form>
        <form *ngSwitchCase="2" (ngSubmit)="nextStep()" #form2="ngForm">
          <!-- Step 2: Contatti - Selezione referenti -->
          <h4>{{ translate('structures.step.contacts') }}</h4>
          <div class="form-row">
            <label>{{ translate('structures.field.referents') }}
              <select name="referents" [(ngModel)]="model.referents" multiple required style="min-width:300px; min-height: 80px;">
                <option *ngFor="let ref of referentsList" [ngValue]="ref">{{ref.firstName}} {{ref.lastName}} ({{ref.role}})</option>
              </select>
            </label>
          </div>
        </form>
        <form *ngSwitchCase="3" (ngSubmit)="nextStep()" #form3="ngForm">
          <!-- Step 3: Dati specifici - Selezione farmacie ospedaliere attive (multi) -->
          <h4>{{ translate('structures.step.specificData') }}</h4>
          <div class="form-row">
            <label>{{ translate('structures.field.hospitalPharmacy') }}
              <select name="hospitalPharmacy" [(ngModel)]="model.hospitalPharmacyIds" multiple required style="min-width:300px; min-height: 80px;">
                <option *ngFor="let pharmacy of hospitalPharmaciesList" [ngValue]="pharmacy.id">{{pharmacy.name}} ({{pharmacy.city}})</option>
              </select>
            </label>
          </div>
        </form>
        <div *ngSwitchCase="4">
          <!-- Step 4: Conferma - Riepilogo struttura, layout label sopra, valore sotto, due colonne -->
          <h4>{{ translate('structures.step.summary') }}</h4>
          <div class="summary4-grid">
            <div class="summary4-row">
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.denom') }}</div>
                <div class="summary2-value">{{model.name}}</div>
              </div>
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.aslReference') }}</div>
                <div class="summary2-value">{{model.code}}</div>
              </div>
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.phone') }}</div>
                <div class="summary2-value">{{model.phone}}</div>
              </div>
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.address') }}</div>
                <div class="summary2-value">{{model.address}}</div>
              </div>
            </div>
            <div class="summary4-row">
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.region') }}</div>
                <div class="summary2-value">{{model.region || '-'}}</div>
              </div>
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.province') }}</div>
                <div class="summary2-value">{{model.province || '-'}}</div>
              </div>
              <div class="summary4-col">
                <div class="summary2-label">{{ translate('structures.field.city') }}</div>
                <div class="summary2-value">{{model.city || '-'}}</div>
              </div>
             
            </div>
            <div class="summary4-row">
              <div class="summary4-col" style="grid-column: span 2;">
                <div class="summary2-label">{{ translate('structures.field.referencePharmacies') }}</div>
                <div class="summary2-value">
                  <ng-container *ngFor="let pharmacy of hospitalPharmaciesList">
                    <span *ngIf="model.hospitalPharmacyIds && model.hospitalPharmacyIds.includes(pharmacy.id)">{{pharmacy.name}} - {{pharmacy.city}}<br></span>
                  </ng-container>
                </div>
              </div>
              <div class="summary4-col" style="grid-column: span 2;">
                <div class="summary2-label">{{ translate('structures.field.referenceContacts') }}</div>
                <div class="summary2-value">
                  <ng-container *ngFor="let ref of model.referents">
                    <div>{{ref.firstName}} {{ref.lastName}}<span *ngIf="ref.role"> - {{ref.role}}</span></div>
                  </ng-container>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
      <div modal-actions *ngIf="!showSuccessPopup">
        <button *ngIf="step>1" class="btn btn-outline" (click)="prevStep()" type="button">Indietro</button>
        <button *ngIf="step>1 && step<4" class="btn btn-primary" (click)="nextStep()" type="button">Avanti</button>
        <button *ngIf="step===4" class="btn btn-primary" (click)="save()" type="button">Conferma</button>
      </div>
    </qtm-step-modal>
  `,
  styleUrls: ['./add-wizard.component.css']
})
export class AddWizardComponentAsl implements OnInit {
  translate(key: string): string {
    try {
      return t(key as any) || key;
    } catch {
      return key;
    }
  }
  // Google Place Autocomplete Web Component handler
  onPlaceSelected(event: any) {
    this.model.googleAddress = event?.place?.formattedAddress || '';
  }
  @Output() close = new EventEmitter<void>();
  step = 1;
  model: any = {
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
    referents: [],
    hospitalPharmacyIds: [],
    structureType: 'ASL'
  };
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

  constructor(
    private geoApi: GeographyApiService,
    private referentApi: ReferentApiService,
    private pharmacyApi: PharmacyApiService,
    private structureApi: StructureApiService
  ) {
    console.log('[AddWizardComponentAsl] COSTRUTTORE: istanza creata');
  }

  ngOnInit(): void {
    console.log('[AddWizardComponentAsl] ngOnInit: Wizard ASL aperto');
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
  }

  loadHospitalPharmacies() {
    this.pharmacyApi.getActiveHospitalPharmacies().subscribe({
      next: (data) => {
        this.hospitalPharmaciesList = data;
      },
      error: () => {
        this.hospitalPharmaciesList = [];
      }
    });
  }

  loadReferents() {
    this.referentApi.getAll().subscribe({
      next: (data) => {
        this.referentsList = data;
      },
      error: () => {
        this.referentsList = [];
      }
    });
  }

  loadRegioni() {
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

  onRegioneChange() {
      console.log('[AddWizardComponentAsl] onRegioneChange: regionId selezionato:', this.model.regionId);
      console.log('[AddWizardComponentAsl] CHIAMO getProvincesByRegion con:', this.model.regionId);
    this.model.region = this.findOptionName(this.regioni, this.model.regionId);
    this.model.provinceId = '';
    this.model.province = '';
    this.model.cityId = '';
    this.model.city = '';
    this.province = [];
    this.comuni = [];
    if (this.model.regionId) {
      this.loadingProvince = true;
      this.geoApi.getProvincesByRegion(this.model.regionId).subscribe({
        next: (data) => {
          this.province = data;
          this.loadingProvince = false;
        },
        error: () => {
          this.province = [];
          this.loadingProvince = false;
        }
      });
    }
  }

  onProvinciaChange() {
    this.model.province = this.findOptionName(this.province, this.model.provinceId);
    this.model.cityId = '';
    this.model.city = '';
    this.comuni = [];
    if (this.model.provinceId) {
      this.loadingComuni = true;
      this.geoApi.getCitiesByProvince(this.model.provinceId).subscribe({
        next: (data) => {
          this.comuni = data;
          this.loadingComuni = false;
        },
        error: () => {
          this.comuni = [];
          this.loadingComuni = false;
        }
      });
    }
  }

  onComuneChange() {
    this.model.city = this.findOptionName(this.comuni, this.model.cityId);
    console.log('[AddWizardComponentAsl] onComuneChange: cityId selezionato:', this.model.cityId, 'city:', this.model.city);
  }

  private findOptionName(options: GeographicOptionDto[], optionId?: number | string | null): string {
    if (typeof optionId !== 'number' && typeof optionId !== 'string') {
      return '';
    }
    const idNum = typeof optionId === 'string' ? parseInt(optionId, 10) : optionId;
    return options.find((option) => option.id === idNum)?.name ?? '';
  }

  nextStep() {
    console.log('[AddWizardComponentAsl] nextStep: step attuale', this.step, 'model:', this.model);
    if (this.step < 4) {
      this.step++;
      console.log('[AddWizardComponentAsl] nextStep: step incrementato a', this.step);
      if (this.step === 4) {
        console.log('[AddWizardComponentAsl] MODEL ALLO STEP 4:', JSON.stringify(this.model));
      }
    }
  }

  prevStep() {
    console.log('[AddWizardComponentAsl] prevStep: step attuale', this.step);
    if (this.step > 1) {
      this.step--;
      console.log('[AddWizardComponentAsl] prevStep: step decrementato a', this.step);
    }
  }

  showSuccessPopup = false;
  errorMessage = '';

  save() {
    console.log('[AddWizardComponentAsl] save: dati da salvare', this.model);
    console.log('[AddWizardComponentAsl] save: JSON.stringify(model):', JSON.stringify(this.model));
    this.errorMessage = '';
    const payload: StructureDto = {
      name: this.model.name,
      code: this.model.code,
      regionId: this.model.regionId,
      provinceId: this.model.provinceId,
      cityId: this.model.cityId,
      address: this.model.address,
      cap: this.model.cap,
      phone: this.model.phone,
      referents: this.model.referents,
      hospitalPharmacyIds: this.model.hospitalPharmacyIds,
      structureType: 'ASL'
    };
    this.structureApi.createStructure(payload).subscribe({
      next: () => {
        this.showSuccessPopup = true;
      },
      error: (err) => {
        this.errorMessage = 'Errore durante il salvataggio. Riprova o controlla i dati.';
        console.error('[AddWizardComponentAsl] Errore salvataggio struttura', err);
      }
    });
  }

  onClose() {
    console.log('[AddWizardComponentAsl] onClose: chiusura wizard richiesta');
    this.close.emit();
  }
}
