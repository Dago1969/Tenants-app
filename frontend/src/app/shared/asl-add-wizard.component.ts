import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QtmStepModalComponent } from './qtm-step-modal.component';

/**
 * Wizard inserimento ASL in 4 step
 */
@Component({
  selector: 'asl-add-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, QtmStepModalComponent],
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
            <label>Denominazione*<input name="denom" [(ngModel)]="model.denom" required /></label>
            <label>Codice ASL*<input name="codice" [(ngModel)]="model.codice" required /></label>
          </div>
          <div class="form-row">
            <label>Regione*<input name="regione" [(ngModel)]="model.regione" required /></label>
            <label>Città*<input name="citta" [(ngModel)]="model.citta" required /></label>
          </div>
        </form>
        <form *ngSwitchCase="2" (ngSubmit)="nextStep()" #form2="ngForm">
          <!-- Step 2: Dati amministrativi -->
          <div class="form-row">
            <label>Codice fiscale*<input name="cf" [(ngModel)]="model.cf" required /></label>
            <label>Partita IVA<input name="piva" [(ngModel)]="model.piva" /></label>
          </div>
        </form>
        <form *ngSwitchCase="3" (ngSubmit)="nextStep()" #form3="ngForm">
          <!-- Step 3: Contatti -->
          <div class="form-row">
            <label>Email*<input name="email" [(ngModel)]="model.email" required type="email" /></label>
            <label>Telefono<input name="tel" [(ngModel)]="model.tel" /></label>
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
  styleUrls: ['./asl-add-wizard.component.css']
})
export class AslAddWizardComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  constructor() {
    console.log('[AslAddWizardComponent] COSTRUTTORE: istanza creata');
  }

  ngOnInit(): void {
    console.log('[AslAddWizardComponent] ngOnInit: Wizard ASL aperto');
    console.log('[AslAddWizardComponent] Stato iniziale:', {
      step: this.step,
      model: this.model
    });
  }

  step = 1;
  model: any = {};
  stepTitles = [
    'Dati anagrafici',
    'Dati amministrativi',
    'Contatti',
    'Conferma'
  ];
  stepDescriptions = [
    'Inserisci i dati anagrafici della struttura',
    'Compila i dati amministrativi richiesti',
    'Aggiungi i contatti principali',
    'Controlla e conferma l’inserimento'
  ];

  nextStep() {
    console.log('[AslAddWizardComponent] nextStep: step attuale', this.step, 'model:', this.model);
    if (this.step < 4) {
      this.step++;
      console.log('[AslAddWizardComponent] nextStep: step incrementato a', this.step);
    }
  }

  prevStep() {
    console.log('[AslAddWizardComponent] prevStep: step attuale', this.step);
    if (this.step > 1) {
      this.step--;
      console.log('[AslAddWizardComponent] prevStep: step decrementato a', this.step);
    }
  }

  save() {
    console.log('[AslAddWizardComponent] save: dati da salvare', this.model);
    // TODO: chiamata API salvataggio
    this.onClose();
  }

  onClose() {
    console.log('[AslAddWizardComponent] onClose: chiusura wizard richiesta');
    this.close.emit();
  }
}
