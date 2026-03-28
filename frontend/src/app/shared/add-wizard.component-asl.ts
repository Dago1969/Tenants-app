import { t } from '../i18n/messages';
import { Component, OnInit, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { GeographyApiService, GeographicOptionDto } from '../core/geography-api.service';
import { ReferentApiService, ReferentDto } from '../core/referent-api.service';
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
      [title]="'Inserimento Struttura ASL'"
      [step]="step"
      [totalSteps]="4"
      [stepTitle]="stepTitles[step-1]"
      [stepDescription]="stepDescriptions[step-1]"
      (close)="onClose()"
    >
      <ng-container [ngSwitch]="step">
        <form *ngSwitchCase="1" (ngSubmit)="nextStep()" #form1="ngForm">
          <!-- Step 1: Dati anagrafici -->
          <div class="form-row">
            <label>Denominazione*<input type="text" name="denom" [(ngModel)]="model.denom" required /></label>
            <label>Codice ASL*<input type="text" name="codice" [(ngModel)]="model.codice" required /></label>
          </div>
          <div class="form-row">
            <label>{{ translate('structures.field.address') }}
              <input type="text" name="address" [(ngModel)]="model.address" required autocomplete="off" />
            </label>
            <label>{{ translate('structures.field.cap') }}
              <input type="text" name="cap" [(ngModel)]="model.cap" maxlength="10" autocomplete="off" />
            </label>
            <label>{{ translate('structures.field.phone') }}
              <input type="text" name="phone" [(ngModel)]="model.phone" autocomplete="off" />
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
          <div class="form-row">
            <label>Regione*
              <select class="search-filter-select" name="regione" [(ngModel)]="model.regioneId" (change)="onRegioneChange()" required>
                <option value="">Seleziona...</option>
                <option *ngFor="let regione of regioni" [value]="regione.id">{{regione.name}}</option>
              </select>
            </label>
            <label>Provincia*
              <select class="search-filter-select" name="provincia" [(ngModel)]="model.provinciaId" (change)="onProvinciaChange()" [disabled]="!province.length" required>
                <option value="">Seleziona...</option>
                <option *ngFor="let provincia of province" [value]="provincia.id">{{provincia.name}}</option>
              </select>
            </label>
            <label>Comune*
              <select class="search-filter-select" name="comune" [(ngModel)]="model.comuneId" [disabled]="!comuni.length" required>
                <option value="">Seleziona...</option>
                <option *ngFor="let comune of comuni" [value]="comune.id">{{comune.name}}</option>
              </select>
            </label>
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
          <!-- Step 3: Contatti -->
          <div class="form-row">
            <label>Email*<input type="email" name="email" [(ngModel)]="model.email" required /></label>
            <label>Telefono<input type="text" name="tel" [(ngModel)]="model.tel" /></label>
          </div>
        </form>
        <div *ngSwitchCase="4">
          <!-- Step 4: Conferma -->
          <h4>Riepilogo dati inseriti</h4>
          <ul>
            <li><b>Denominazione:</b> {{model.denom}}</li>
            <li><b>Codice ASL:</b> {{model.codice}}</li>
            <li><b>Regione:</b> {{model.regione}}</li>
            <li><b>Città:</b> {{model.citta}}</li>
            <li><b>Codice fiscale:</b> {{model.cf}}</li>
            <li><b>Partita IVA:</b> {{model.piva}}</li>
            <li><b>Email:</b> {{model.email}}</li>
            <li><b>Telefono:</b> {{model.tel}}</li>
          </ul>
        </div>
      </ng-container>
      <div modal-actions>
        <button *ngIf="step>1" class="btn btn-outline" (click)="prevStep()" type="button">Indietro</button>
        <button *ngIf="step<4" class="btn btn-primary" (click)="nextStep()" type="button">Avanti</button>
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
    regioneId: '',
    regione: '',
    provinciaId: '',
    provincia: '',
    comuneId: '',
    comune: '',
    referents: []
  };
  regioni: GeographicOptionDto[] = [];
  province: GeographicOptionDto[] = [];
  comuni: GeographicOptionDto[] = [];
  loadingRegioni = false;
  loadingProvince = false;
  loadingComuni = false;
  stepTitles = [
    this.translate('structures.step.generalData'),
    this.translate('structures.step.administrativeData'),
    this.translate('structures.step.contacts'),
    this.translate('structures.step.confirm')
  ];
  stepDescriptions = [
    this.translate('structures.step.generalData.desc'),
    this.translate('structures.step.administrativeData.desc'),
    this.translate('structures.step.contacts.desc'),
    this.translate('structures.step.confirm.desc')
  ];


  referentsList: ReferentDto[] = [];

  constructor(private geoApi: GeographyApiService, private referentApi: ReferentApiService) {
    console.log('[AddWizardComponentAsl] COSTRUTTORE: istanza creata');
  }

  ngOnInit(): void {
    console.log('[AddWizardComponentAsl] ngOnInit: Wizard ASL aperto');
    this.loadRegioni();
    this.loadReferents();
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
    this.model.regione = this.findOptionName(this.regioni, this.model.regioneId);
    this.model.provinciaId = '';
    this.model.provincia = '';
    this.model.comuneId = '';
    this.model.comune = '';
    this.province = [];
    this.comuni = [];
    if (this.model.regioneId) {
      this.loadingProvince = true;
      this.geoApi.getProvincesByRegion(this.model.regioneId).subscribe({
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
    this.model.provincia = this.findOptionName(this.province, this.model.provinciaId);
    this.model.comuneId = '';
    this.model.comune = '';
    this.comuni = [];
    if (this.model.provinciaId) {
      this.loadingComuni = true;
      this.geoApi.getCitiesByProvince(this.model.provinciaId).subscribe({
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
    this.model.comune = this.findOptionName(this.comuni, this.model.comuneId);
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
    }
  }

  prevStep() {
    console.log('[AddWizardComponentAsl] prevStep: step attuale', this.step);
    if (this.step > 1) {
      this.step--;
      console.log('[AddWizardComponentAsl] prevStep: step decrementato a', this.step);
    }
  }

  save() {
    console.log('[AddWizardComponentAsl] save: dati da salvare', this.model);
    // TODO: chiamata API salvataggio
    this.onClose();
  }

  onClose() {
    console.log('[AddWizardComponentAsl] onClose: chiusura wizard richiesta');
    this.close.emit();
  }
}
