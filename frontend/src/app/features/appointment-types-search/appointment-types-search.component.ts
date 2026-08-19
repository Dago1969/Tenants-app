import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';
import { QtmStepModalComponent } from '../../shared/qtm-step-modal.component';
import { AppointmentService, AppointmentType } from '../../services/appointment.service';
import { MessageKey, t } from '../../i18n/messages';

interface AppointmentTypeWizardStep {
  titleKey: MessageKey;
  descriptionKey: MessageKey;
}

@Component({
  selector: 'app-appointment-types-search',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchPageComponent, QtmStepModalComponent],
  template: `
    <app-search-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [filters]="filters"
      [resultColumns]="resultColumns"
      [autoSearch]="true"
      [showCreateAction]="false"
      [showViewAction]="false"
      [interceptEditAction]="true"
      (editAction)="openWizard($event)"
    >
      <button search-header-action class="btn btn-primary" type="button" (click)="openWizard()">
        <span class="icon">+</span> {{ translate('appointment.button.addType') }}
      </button>
    </app-search-page>

    <qtm-step-modal
      *ngIf="wizardOpen"
      [title]="translate(editingAppointmentTypeId === null ? 'appointment.title.createType' : 'appointment.title.editType')"
      [step]="wizardStep"
      [totalSteps]="wizardSteps.length"
      [stepTitle]="translate(currentWizardStep.titleKey)"
      [stepDescription]="translate(currentWizardStep.descriptionKey)"
      (close)="closeWizard()"
    >
      <div *ngIf="wizardErrorMessage" class="wizard-error-message">
        {{ wizardErrorMessage }}
      </div>

      <ng-container [ngSwitch]="wizardStep">
        <section *ngSwitchCase="1" class="appointment-type-wizard-grid">
          <label class="appointment-type-field">
            <span>{{ translate('appointment.field.name') }}</span>
            <input type="text" [(ngModel)]="appointmentTypeForm.name" [disabled]="saving" />
          </label>

          <label class="appointment-type-field appointment-type-field-wide">
            <span>{{ translate('appointment.field.description') }}</span>
            <textarea [(ngModel)]="appointmentTypeForm.description" rows="4" [disabled]="saving"></textarea>
          </label>

          <label class="appointment-type-field">
            <span>{{ translate('appointment.field.duration') }}</span>
            <input type="number" min="1" [(ngModel)]="appointmentTypeForm.durationMinutes" [disabled]="saving" />
          </label>
        </section>

        <section *ngSwitchCase="2" class="appointment-type-summary-grid">
          <div class="appointment-type-summary-card">
            <span class="appointment-type-summary-label">{{ translate('appointment.field.name') }}</span>
            <strong>{{ appointmentTypeForm.name || '-' }}</strong>
          </div>
          <div class="appointment-type-summary-card">
            <span class="appointment-type-summary-label">{{ translate('appointment.field.duration') }}</span>
            <strong>{{ appointmentTypeForm.durationMinutes || 0 }} {{ translate('appointment.label.minutes') }}</strong>
          </div>
          <div class="appointment-type-summary-card appointment-type-summary-card-wide">
            <span class="appointment-type-summary-label">{{ translate('appointment.field.description') }}</span>
            <strong>{{ appointmentTypeForm.description || '-' }}</strong>
          </div>
        </section>
      </ng-container>

      <div modal-actions>
        <button *ngIf="wizardStep > 1" class="btn btn-outline" type="button" (click)="previousStep()" [disabled]="saving">
          {{ translate('crud.actions.back') }}
        </button>
        <button *ngIf="wizardStep < wizardSteps.length" class="btn btn-primary" type="button" (click)="nextStep()" [disabled]="saving">
          {{ translate('crud.actions.next') }}
        </button>
        <button *ngIf="wizardStep === wizardSteps.length" class="btn btn-primary" type="button" (click)="saveAppointmentType()" [disabled]="saving">
          {{ translate(editingAppointmentTypeId === null ? 'crud.actions.create' : 'crud.actions.update') }}
        </button>
      </div>
    </qtm-step-modal>
  `,
  styles: [`
    .appointment-type-wizard-grid,
    .appointment-type-summary-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .appointment-type-field,
    .appointment-type-summary-card {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .appointment-type-field span,
    .appointment-type-summary-label {
      font-weight: 600;
      color: #334155;
    }

    .appointment-type-field input,
    .appointment-type-field textarea {
      width: 100%;
      padding: 0.75rem 0.9rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.9rem;
      font: inherit;
      background: #fff;
      box-sizing: border-box;
    }

    .appointment-type-field-wide,
    .appointment-type-summary-card-wide {
      grid-column: 1 / -1;
    }

    .appointment-type-summary-card {
      padding: 1rem;
      border: 1px solid #dbe4f0;
      border-radius: 1rem;
      background: #f8fafc;
    }

    .wizard-error-message {
      margin-bottom: 1rem;
      padding: 0.75rem 0.9rem;
      border-radius: 0.8rem;
      background: #fee2e2;
      color: #991b1b;
    }

    @media (max-width: 768px) {
      .appointment-type-wizard-grid,
      .appointment-type-summary-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AppointmentTypesSearchComponent {
  @ViewChild(SearchPageComponent) private searchPage?: SearchPageComponent;

  readonly titleKey = 'appointment.types.search.title' as const;
  readonly endpoint = 'appointments/types';
  readonly filters: SearchField[] = [];
  readonly resultColumns: SearchField[] = [
    { key: 'name', labelKey: 'appointment.field.name', type: 'text' },
    { key: 'description', labelKey: 'appointment.field.description', type: 'text' },
    { key: 'durationMinutes', labelKey: 'appointment.field.duration', type: 'number' }
  ];
  readonly wizardSteps: AppointmentTypeWizardStep[] = [
    { titleKey: 'appointment.types.wizard.step.details', descriptionKey: 'appointment.types.wizard.step.details.description' },
    { titleKey: 'appointment.types.wizard.step.summary', descriptionKey: 'appointment.types.wizard.step.summary.description' }
  ];

  wizardOpen = false;
  wizardStep = 1;
  saving = false;
  wizardErrorMessage = '';
  editingAppointmentTypeId: number | null = null;
  appointmentTypeForm: { name: string; description: string; durationMinutes: number | null } = this.createEmptyForm();

  constructor(private readonly appointmentService: AppointmentService) {}

  get currentWizardStep(): AppointmentTypeWizardStep {
    return this.wizardSteps[this.wizardStep - 1];
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  openWizard(id?: string): void {
    this.wizardErrorMessage = '';
    this.wizardStep = 1;

    if (!id) {
      this.editingAppointmentTypeId = null;
      this.appointmentTypeForm = this.createEmptyForm();
      this.wizardOpen = true;
      return;
    }

    const normalizedId = Number(id);
    if (Number.isNaN(normalizedId) || normalizedId <= 0) {
      return;
    }

    this.appointmentService.getAllAppointmentTypes().subscribe({
      next: (types) => {
        const currentType = types.find((type) => type.id === normalizedId);
        if (!currentType) {
          this.wizardErrorMessage = this.translate('appointment.types.error.notFound');
          return;
        }

        this.editingAppointmentTypeId = currentType.id;
        this.appointmentTypeForm = {
          name: currentType.name,
          description: currentType.description,
          durationMinutes: currentType.durationMinutes
        };
        this.wizardOpen = true;
      },
      error: () => {
        this.wizardErrorMessage = this.translate('crud.error.load');
      }
    });
  }

  closeWizard(refresh = false): void {
    this.wizardOpen = false;
    this.wizardStep = 1;
    this.saving = false;
    this.wizardErrorMessage = '';
    this.editingAppointmentTypeId = null;
    this.appointmentTypeForm = this.createEmptyForm();

    if (refresh) {
      this.searchPage?.search(false);
    }
  }

  previousStep(): void {
    if (this.wizardStep > 1) {
      this.wizardStep -= 1;
    }
  }

  nextStep(): void {
    if (!this.validateForm()) {
      return;
    }

    if (this.wizardStep < this.wizardSteps.length) {
      this.wizardStep += 1;
    }
  }

  saveAppointmentType(): void {
    if (!this.validateForm() || this.saving) {
      return;
    }

    this.saving = true;
    const payload = {
      name: this.appointmentTypeForm.name.trim(),
      description: this.appointmentTypeForm.description.trim(),
      durationMinutes: this.appointmentTypeForm.durationMinutes ?? 0
    };

    const request = this.editingAppointmentTypeId === null
      ? this.appointmentService.createAppointmentType(payload)
      : this.appointmentService.updateAppointmentType(this.editingAppointmentTypeId, payload);

    request.subscribe({
      next: () => this.closeWizard(true),
      error: (error: unknown) => {
        this.saving = false;
        const typedError = error as { error?: { detail?: string; message?: string } };
        const detail = typeof typedError?.error?.detail === 'string' ? typedError.error.detail.trim() : '';
        const message = typeof typedError?.error?.message === 'string' ? typedError.error.message.trim() : '';
        this.wizardErrorMessage = detail || message || this.translate('crud.error.create');
      }
    });
  }

  private validateForm(): boolean {
    if (!this.appointmentTypeForm.name.trim()) {
      this.wizardErrorMessage = this.translate('appointment.error.nameRequired');
      return false;
    }

    if ((this.appointmentTypeForm.durationMinutes ?? 0) <= 0) {
      this.wizardErrorMessage = this.translate('appointment.error.durationRequired');
      return false;
    }

    this.wizardErrorMessage = '';
    return true;
  }

  private createEmptyForm(): { name: string; description: string; durationMinutes: number | null } {
    return {
      name: '',
      description: '',
      durationMinutes: null
    };
  }
}