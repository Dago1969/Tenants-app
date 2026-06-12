import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { MessageKey, t } from '../../i18n/messages';
import { QtmStepModalComponent } from '../../shared/qtm-step-modal.component';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';
import { TicketDto, TicketService, TicketTherapeuticPlanDto } from '../../services/ticket.service';

interface TicketWizardStep {
  titleKey: MessageKey;
  descriptionKey: MessageKey;
}

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

interface TherapeuticPlanOption {
  value: string;
  patientId: string;
  label: string;
}

interface TicketTypeOption {
  value: string;
  labelKey: MessageKey;
}

@Component({
  selector: 'app-tickets-search',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchPageComponent, QtmStepModalComponent],
  template: `
    <app-search-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [filters]="filters"
      [resultColumns]="resultColumns"
      [showCloseAction]="true"
      [autoSearch]="true"
      [showCreateAction]="false"
      [showDeleteAction]="false"
      [showEditAction]="canEditTickets"
      [interceptEditAction]="true"
      (editAction)="openWizard($event)"
      (closeAction)="onCloseAction($event)"
    >
      <button search-header-action class="btn btn-primary" type="button" (click)="openWizard()">
        <span class="icon">＋</span> {{ translate('ticket.actions.add') }}
      </button>
    </app-search-page>

    <qtm-step-modal
      *ngIf="wizardOpen"
      [title]="translate(editingTicketId === null ? 'ticket.wizard.title.create' : 'ticket.wizard.title.edit')"
      [step]="wizardStep"
      [totalSteps]="wizardSteps.length"
      [stepTitle]="translate(currentWizardStep.titleKey)"
      [stepDescription]="translate(currentWizardStep.descriptionKey)"
      (close)="closeWizard()"
    >
      <div *ngIf="wizardErrorMessage" class="ticket-wizard-error-message">
        {{ wizardErrorMessage }}
      </div>

      <ng-container [ngSwitch]="wizardStep">
        <section *ngSwitchCase="1" class="ticket-wizard-grid">
          <label class="ticket-field">
            <span>{{ translate('ticket.field.realm') }}</span>
            <input type="text" [(ngModel)]="ticketForm.realm" [disabled]="saving" readonly />
          </label>

          <label class="ticket-field">
            <span>{{ translate('ticket.field.project') }}</span>
            <input type="text" [(ngModel)]="ticketForm.project" [disabled]="saving" readonly />
          </label>

          <label class="ticket-field">
            <span>{{ translate('ticket.field.patientId') }}</span>
            <input type="text" [(ngModel)]="ticketForm.patientId" [disabled]="true" readonly />
          </label>

          <label class="ticket-field">
            <span>{{ translate('ticket.field.therapeuticPlanId') }}</span>
            <select
              [(ngModel)]="ticketForm.therapeuticPlanId"
              (ngModelChange)="onTherapeuticPlanChange()"
              [disabled]="saving || loadingTherapeuticPlans"
            >
              <option value="">{{ translate('ticket.placeholder.selectTherapeuticPlan') }}</option>
              <option *ngFor="let option of therapeuticPlanOptions" [ngValue]="option.value">{{ option.label }}</option>
            </select>
          </label>

          <label class="ticket-field">
            <span>{{ translate('ticket.field.ticketType') }}</span>
            <select [(ngModel)]="ticketForm.ticketType" [disabled]="saving">
              <option value="">{{ translate('ticket.placeholder.selectTicketType') }}</option>
              <option *ngFor="let option of ticketTypeOptions" [ngValue]="option.value">{{ translate(option.labelKey) }}</option>
            </select>
          </label>

          <label class="ticket-field">
            <span>{{ translate('ticket.field.status') }}</span>
            <select [(ngModel)]="ticketForm.status" [disabled]="saving">
              <option *ngFor="let option of statusOptions" [ngValue]="option.value">{{ translate(option.labelKey) }}</option>
            </select>
          </label>

          <label class="ticket-field ticket-field-wide">
            <span>{{ translate('ticket.field.title') }}</span>
            <input type="text" [(ngModel)]="ticketForm.title" [disabled]="saving" />
          </label>

          <label class="ticket-field ticket-field-wide">
            <span>{{ translate('ticket.field.description') }}</span>
            <textarea [(ngModel)]="ticketForm.description" rows="4" [disabled]="saving"></textarea>
          </label>

          <label class="ticket-field ticket-field-wide">
            <span>{{ translate('ticket.field.contentJson') }}</span>
            <textarea [(ngModel)]="ticketForm.contentJson" rows="4" [disabled]="saving"></textarea>
          </label>
        </section>

        <section *ngSwitchCase="2" class="ticket-summary-grid">
          <div class="ticket-summary-card">
            <span class="ticket-summary-label">{{ translate('ticket.field.realm') }}</span>
            <strong>{{ ticketForm.realm || '-' }}</strong>
          </div>
          <div class="ticket-summary-card">
            <span class="ticket-summary-label">{{ translate('ticket.field.project') }}</span>
            <strong>{{ ticketForm.project || '-' }}</strong>
          </div>
          <div class="ticket-summary-card">
            <span class="ticket-summary-label">{{ translate('ticket.field.patientId') }}</span>
            <strong>{{ ticketForm.patientId || '-' }}</strong>
          </div>
          <div class="ticket-summary-card">
            <span class="ticket-summary-label">{{ translate('ticket.field.therapeuticPlanId') }}</span>
            <strong>{{ ticketForm.therapeuticPlanId || '-' }}</strong>
          </div>
          <div class="ticket-summary-card">
            <span class="ticket-summary-label">{{ translate('ticket.field.ticketType') }}</span>
            <strong>{{ ticketTypeLabel(ticketForm.ticketType) }}</strong>
          </div>
          <div class="ticket-summary-card">
            <span class="ticket-summary-label">{{ translate('ticket.field.status') }}</span>
            <strong>{{ translate(statusLabelKey(ticketForm.status)) }}</strong>
          </div>
          <div class="ticket-summary-card ticket-summary-card-wide">
            <span class="ticket-summary-label">{{ translate('ticket.field.title') }}</span>
            <strong>{{ ticketForm.title || '-' }}</strong>
          </div>
          <div class="ticket-summary-card ticket-summary-card-wide">
            <span class="ticket-summary-label">{{ translate('ticket.field.description') }}</span>
            <strong>{{ ticketForm.description || '-' }}</strong>
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
        <button *ngIf="wizardStep === wizardSteps.length" class="btn btn-primary" type="button" (click)="saveTicket()" [disabled]="saving">
          {{ translate(editingTicketId === null ? 'crud.actions.create' : 'crud.actions.update') }}
        </button>
      </div>
    </qtm-step-modal>
  `,
  styles: [`
    .ticket-wizard-grid,
    .ticket-summary-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .ticket-field,
    .ticket-summary-card {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .ticket-field span,
    .ticket-summary-label {
      font-weight: 600;
      color: #334155;
    }

    .ticket-field input,
    .ticket-field select,
    .ticket-field textarea {
      width: 100%;
      padding: 0.75rem 0.9rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.9rem;
      font: inherit;
      background: #fff;
      box-sizing: border-box;
    }

    .ticket-field-wide,
    .ticket-summary-card-wide {
      grid-column: 1 / -1;
    }

    .ticket-summary-card {
      padding: 1rem;
      border: 1px solid #dbe4f0;
      border-radius: 1rem;
      background: #f8fafc;
    }

    .ticket-wizard-error-message {
      margin-bottom: 1rem;
      padding: 0.75rem 0.9rem;
      border-radius: 0.8rem;
      background: #fee2e2;
      color: #991b1b;
    }

    @media (max-width: 768px) {
      .ticket-wizard-grid,
      .ticket-summary-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TicketsSearchComponent implements OnInit {
  @ViewChild(SearchPageComponent) private searchPage?: SearchPageComponent;

  readonly titleKey = 'ticket.search.title' as const;
  readonly endpoint = 'tickets/search';
  readonly filters: SearchField[] = [
    { key: 'realm', labelKey: 'ticket.field.realm', type: 'text' },
    { key: 'project', labelKey: 'ticket.field.project', type: 'text' },
    { key: 'patientId', labelKey: 'ticket.field.patientId', type: 'text' },
    {
      key: 'status',
      labelKey: 'ticket.field.status',
      type: 'select',
      options: [
        { value: 'OPEN', label: 'ticket.status.open' },
        { value: 'IN_PROGRESS', label: 'ticket.status.inProgress' },
        { value: 'CLOSED', label: 'ticket.status.closed' }
      ]
    }
  ];
  resultColumns: SearchField[] = [];
  readonly wizardSteps: TicketWizardStep[] = [
    { titleKey: 'ticket.wizard.step.details.title', descriptionKey: 'ticket.wizard.step.details.description' },
    { titleKey: 'ticket.wizard.step.summary.title', descriptionKey: 'ticket.wizard.step.summary.description' }
  ];
  readonly statusOptions: Array<{ value: TicketStatus; labelKey: MessageKey }> = [
    { value: 'OPEN', labelKey: 'ticket.status.open' },
    { value: 'IN_PROGRESS', labelKey: 'ticket.status.inProgress' },
    { value: 'CLOSED', labelKey: 'ticket.status.closed' }
  ];
  readonly ticketTypeOptions: TicketTypeOption[] = [
    { value: 'THERAPEUTIC_PLAN_UPDATE', labelKey: 'ticket.type.therapeuticPlanUpdate' },
    { value: 'PATIENT_SUPPORT', labelKey: 'ticket.type.patientSupport' },
    { value: 'TECHNICAL_ISSUE', labelKey: 'ticket.type.technicalIssue' },
    { value: 'ADMINISTRATIVE_REQUEST', labelKey: 'ticket.type.administrativeRequest' }
  ];

  wizardOpen = false;
  wizardStep = 1;
  saving = false;
  loadingTherapeuticPlans = false;
  wizardErrorMessage = '';
  editingTicketId: number | null = null;
  canEditTickets = false;
  therapeuticPlanOptions: TherapeuticPlanOption[] = [];
  ticketForm: TicketDto = this.createEmptyForm();

  constructor(
    private readonly ticketService: TicketService,
    private readonly authService: AuthService
  ) {
    const selectedRole = this.authService.getSelectedRole().toLowerCase();
    this.canEditTickets = selectedRole.includes('superadmin') || selectedRole.includes('operatoreqtm');
  }

  onCloseAction(id: string): void {
    const normalizedId = Number(id);
    if (Number.isNaN(normalizedId) || normalizedId <= 0) {
      return;
    }

    if (!confirm(this.translate('ticket.action.confirmClose') || 'Confermi chiusura ticket?')) {
      return;
    }

    this.ticketService.changeStatus(normalizedId, 'CLOSED').subscribe({
      next: () => {
        this.searchPage?.search();
      },
      error: (err) => {
        const reason = err?.error?.message || err?.message || err?.statusText || '';
        alert(`${this.translate('ticket.error.update')}${reason ? ': ' + reason : ''}`);
      }
    });
  }

  ngOnInit(): void {
    this.loadTherapeuticPlans();

    // Popola le colonne dei risultati includendo la mappa di visualizzazione
    // per `ticketType` in modo che i codici vengano decodificati in etichette.
    this.resultColumns = [
      { key: 'realm', labelKey: 'ticket.field.realm', type: 'text' },
      { key: 'project', labelKey: 'ticket.field.project', type: 'text' },
      { key: 'patientId', labelKey: 'ticket.field.patientId', type: 'text' },
      { key: 'therapeuticPlanId', labelKey: 'ticket.field.therapeuticPlanId', type: 'text' },
      {
        key: 'ticketType',
        labelKey: 'ticket.field.ticketType',
        type: 'text',
        displayValueMap: this.buildTicketTypeDisplayMap()
      },
      { key: 'title', labelKey: 'ticket.field.title', type: 'text' },
      { key: 'status', labelKey: 'ticket.field.status', type: 'text' },
      { key: 'updatedAt', labelKey: 'ticket.field.updatedAt', type: 'text' }
    ];
  }

  get currentWizardStep(): TicketWizardStep {
    return this.wizardSteps[this.wizardStep - 1];
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  openWizard(id?: string): void {
    this.wizardErrorMessage = '';
    this.wizardStep = 1;

    if (!id) {
      this.editingTicketId = null;
      this.ticketForm = this.createEmptyForm();
      this.onTherapeuticPlanChange();
      this.wizardOpen = true;
      return;
    }

    const normalizedId = Number(id);
    if (Number.isNaN(normalizedId) || normalizedId <= 0) {
      return;
    }

    this.ticketService.getTicketById(normalizedId).subscribe({
      next: (ticket) => {
        this.editingTicketId = normalizedId;
        this.ticketForm = {
          realm: ticket.realm,
          project: ticket.project,
          patientId: ticket.patientId ?? '',
          therapeuticPlanId: ticket.therapeuticPlanId ?? '',
          ticketType: ticket.ticketType,
          status: (ticket.status as TicketStatus) || 'OPEN',
          title: ticket.title,
          description: ticket.description,
          contentJson: ticket.contentJson ?? ''
        };
        this.onTherapeuticPlanChange();
        this.wizardOpen = true;
      },
      error: () => {
        this.wizardErrorMessage = this.translate('ticket.error.load');
      }
    });
  }

  closeWizard(): void {
    this.wizardOpen = false;
    this.wizardStep = 1;
    this.wizardErrorMessage = '';
    this.saving = false;
  }

  nextStep(): void {
    const validationError = this.validateStep();
    if (validationError) {
      this.wizardErrorMessage = validationError;
      return;
    }

    this.wizardErrorMessage = '';
    this.wizardStep += 1;
  }

  previousStep(): void {
    this.wizardErrorMessage = '';
    this.wizardStep -= 1;
  }

  saveTicket(): void {
    const validationError = this.validateStep();
    if (validationError) {
      this.wizardErrorMessage = validationError;
      return;
    }

    this.saving = true;
    this.wizardErrorMessage = '';

    const request$ = this.editingTicketId === null
      ? this.ticketService.createTicket(this.ticketForm)
      : this.ticketService.updateTicket(this.editingTicketId, this.ticketForm);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.closeWizard();
        this.searchPage?.search();
      },
      error: () => {
        this.saving = false;
        this.wizardErrorMessage = this.translate(
          this.editingTicketId === null ? 'ticket.error.create' : 'ticket.error.update'
        );
      }
    });
  }

  statusLabelKey(status: string | undefined): MessageKey {
    switch (status) {
      case 'IN_PROGRESS':
        return 'ticket.status.inProgress';
      case 'CLOSED':
        return 'ticket.status.closed';
      default:
        return 'ticket.status.open';
    }
  }

  ticketTypeLabel(type: string | undefined): string {
    if (!type?.trim()) {
      return '-';
    }

    const option = this.ticketTypeOptions.find((item) => item.value === type);
    if (!option) {
      return type;
    }

    return this.translate(option.labelKey);
  }

  onTherapeuticPlanChange(): void {
    const selectedPlan = this.therapeuticPlanOptions.find(
      (option) => option.value === (this.ticketForm.therapeuticPlanId ?? '')
    );
    this.ticketForm.patientId = selectedPlan?.patientId ?? '';
  }

  private validateStep(): string {
    if (!this.ticketForm.realm.trim()) {
      return this.translate('ticket.validation.realmRequired');
    }

    if (!this.ticketForm.project.trim()) {
      return this.translate('ticket.validation.projectRequired');
    }

    if (!(this.ticketForm.therapeuticPlanId ?? '').trim()) {
      return this.translate('ticket.validation.therapeuticPlanRequired');
    }

    if (!(this.ticketForm.patientId ?? '').trim()) {
      return this.translate('ticket.validation.patientIdDerivedRequired');
    }

    if (!this.ticketForm.ticketType.trim()) {
      return this.translate('ticket.validation.ticketTypeRequired');
    }

    if (!this.ticketForm.title.trim()) {
      return this.translate('ticket.validation.titleRequired');
    }

    if (!this.ticketForm.description.trim()) {
      return this.translate('ticket.validation.descriptionRequired');
    }

    return '';
  }

  private createEmptyForm(): TicketDto {
    return {
      realm: 'QTM',
      project: this.authService.getSelectedProject(),
      patientId: '',
      therapeuticPlanId: '',
      ticketType: '',
      status: 'OPEN',
      title: '',
      description: '',
      contentJson: ''
    };
  }

  private loadTherapeuticPlans(): void {
    const selectedProject = this.authService.getSelectedProject().trim();
    if (!selectedProject) {
      this.therapeuticPlanOptions = [];
      return;
    }

    this.loadingTherapeuticPlans = true;
    this.ticketService.getTherapeuticPlansByProject(selectedProject).subscribe({
      next: (plans) => {
        this.therapeuticPlanOptions = (plans ?? [])
          .filter((plan) => (plan.projectCode ?? '').trim() === selectedProject)
          .map((plan) => this.toTherapeuticPlanOption(plan))
          .filter((option): option is TherapeuticPlanOption => option !== null)
          .sort((left, right) => left.label.localeCompare(right.label, 'it', { sensitivity: 'base' }));
        this.onTherapeuticPlanChange();
        this.loadingTherapeuticPlans = false;
      },
      error: () => {
        this.loadingTherapeuticPlans = false;
        this.therapeuticPlanOptions = [];
      }
    });
  }

  private toTherapeuticPlanOption(plan: TicketTherapeuticPlanDto): TherapeuticPlanOption | null {
    if (typeof plan.id !== 'number') {
      return null;
    }

    const patientId = plan.patientId !== null && plan.patientId !== undefined
      ? String(plan.patientId)
      : '';
    const displayName = typeof plan.patientDisplayName === 'string' ? plan.patientDisplayName.trim() : '';

    return {
      value: String(plan.id),
      patientId,
      label: this.buildTherapeuticPlanLabel(String(plan.id), patientId, displayName)
    };
  }

  private buildTicketTypeDisplayMap(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const option of this.ticketTypeOptions) {
      map[option.value] = this.translate(option.labelKey);
    }
    return map;
  }

  private buildTherapeuticPlanLabel(planId: string, patientId: string, patientDisplayName: string): string {
    if (patientDisplayName && patientId) {
      return `${planId} - ${patientDisplayName} (${patientId})`;
    }
    if (patientDisplayName) {
      return `${planId} - ${patientDisplayName}`;
    }
    if (patientId) {
      return `${planId} (${patientId})`;
    }
    return planId;
  }
}
