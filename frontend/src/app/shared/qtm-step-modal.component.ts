import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * QtmStepModal: Modal riutilizzabile per wizard a step (es. inserimento/modifica dati)
 * - Header blu con titolo e pulsante chiudi
 * - Stepper con titolo step e barra avanzamento
 * - Area centrale dati (ng-content)
 * - Barra pulsanti (ng-content o input)
 * - Descrizione step in basso
 */
@Component({
  selector: 'qtm-step-modal',
  standalone: true,
  template: `
    <div class="qtm-modal-backdrop">
      <div class="qtm-modal">
        <div class="qtm-modal-header">
          <span class="qtm-modal-title">{{ title }}</span>
          <button class="qtm-modal-close" (click)="close.emit()" aria-label="Chiudi">&times;</button>
        </div>
        <div class="qtm-modal-stepper">
          <span class="qtm-modal-step-title">Step {{ step }} / {{ totalSteps }}: {{ stepTitle }}</span>
          <div class="qtm-modal-progress-bar">
            <div class="qtm-modal-progress" [style.width.%]="progressPercent"></div>
          </div>
        </div>
        <div class="qtm-modal-content">
          <ng-content></ng-content>
        </div>
        <div class="qtm-modal-actions">
          <ng-content select="[modal-actions]"></ng-content>
        </div>
        <div class="qtm-modal-description">
          {{ stepDescription }}
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./qtm-step-modal.component.css']
})
export class QtmStepModalComponent {
  @Input() title = '';
  @Input() step = 1;
  @Input() totalSteps = 1;
  @Input() stepTitle = '';
  @Input() stepDescription = '';
  @Output() close = new EventEmitter<void>();

  get progressPercent(): number {
    return this.totalSteps > 1 ? (this.step / this.totalSteps) * 100 : 100;
  }
}
