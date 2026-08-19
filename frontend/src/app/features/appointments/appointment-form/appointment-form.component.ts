import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Appointment, AppointmentService, AppointmentType } from '../../../services/appointment.service';
import { MessageKey, t } from '../../../i18n/messages';

interface AppointmentFormNurse {
  id: number;
  fullName: string;
}

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="form-container">
      <div *ngIf="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div *ngIf="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <p *ngIf="isEditMode" class="info-message">
        {{ translate('appointment.help.editLimitedFields') }}
      </p>

      <form (ngSubmit)="submitForm()" [ngClass]="{ loading: saving }">
        <div *ngIf="!isEditMode; else appointmentTypeReadonly" class="form-group">
          <label for="appointmentType">{{ translate('appointment.field.type') }} <span class="required">*</span></label>
          <select
            id="appointmentType"
            [(ngModel)]="form.appointmentTypeId"
            (ngModelChange)="onAppointmentTypeChange()"
            name="appointmentTypeId"
            class="form-control"
            [disabled]="loading || saving"
          >
            <option [ngValue]="null" selected disabled>{{ translate('appointment.placeholder.selectType') }}</option>
            <option *ngFor="let type of appointmentTypes" [ngValue]="type.id">
              {{ type.name }} ({{ type.durationMinutes }}{{ ' ' + translate('appointment.label.minutes') }})
            </option>
          </select>
        </div>

        <ng-template #appointmentTypeReadonly>
          <div class="form-group">
            <label for="appointmentTypeReadonly">{{ translate('appointment.field.type') }}</label>
            <input
              id="appointmentTypeReadonly"
              type="text"
              class="form-control"
              [value]="selectedAppointmentTypeLabel"
              disabled
            />
          </div>
        </ng-template>

        <div class="form-group">
          <label for="nurse">{{ translate('appointment.field.nurse') }} <span class="required">*</span></label>
          <select
            id="nurse"
            [(ngModel)]="form.nurseId"
            name="nurseId"
            class="form-control"
            [disabled]="loading || saving"
          >
            <option [ngValue]="null" selected disabled>{{ translate('appointment.placeholder.selectNurse') }}</option>
            <option *ngFor="let nurse of planNurses" [ngValue]="nurse.id">
              {{ nurse.fullName }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="startDateTime">{{ translate('appointment.field.startDateTime') }} <span class="required">*</span></label>
          <input
            type="datetime-local"
            id="startDateTime"
            [(ngModel)]="form.startDateTime"
            (ngModelChange)="onStartDateTimeChange()"
            name="startDateTime"
            class="form-control"
            [disabled]="loading || saving"
          />
        </div>

        <div class="form-group">
          <label for="endDateTime">{{ translate('appointment.field.endDateTime') }}</label>
          <input
            type="datetime-local"
            id="endDateTime"
            [value]="estimatedEndTime"
            class="form-control"
            disabled
          />
          <small class="form-text">{{ translate('appointment.help.estimatedEnd') }}</small>
        </div>

        <div *ngIf="!isEditMode" class="form-group">
          <label for="recurrence">{{ translate('appointment.field.recurrence') }} <span class="required">*</span></label>
          <select
            id="recurrence"
            [(ngModel)]="form.recurrenceType"
            name="recurrenceType"
            class="form-control"
            [disabled]="loading || saving"
          >
            <option *ngFor="let type of recurrenceTypes" [value]="type.value">
              {{ translate(type.label) }}
            </option>
          </select>
        </div>

        <div *ngIf="!isEditMode && isRecurrent()" class="form-group">
          <label for="recurrenceEndDate">{{ translate('appointment.field.recurrenceEndDate') }} <span class="required">*</span></label>
          <input
            type="date"
            id="recurrenceEndDate"
            [(ngModel)]="form.recurrenceEndDate"
            name="recurrenceEndDate"
            class="form-control"
            [disabled]="loading || saving"
          />
        </div>

        <div *ngIf="!isEditMode" class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              [(ngModel)]="form.reminderEnabled"
              name="reminderEnabled"
              [disabled]="loading || saving"
            />
            {{ translate('appointment.field.reminderEnabled') }}
          </label>
        </div>

        <div *ngIf="!isEditMode && form.reminderEnabled" class="form-group">
          <label for="reminderMinutes">{{ translate('appointment.field.reminderMinutesBefore') }}</label>
          <input
            type="number"
            id="reminderMinutes"
            [(ngModel)]="form.reminderMinutesBefore"
            name="reminderMinutesBefore"
            class="form-control"
            min="1"
            [disabled]="loading || saving"
          />
        </div>

        <div *ngIf="!isEditMode" class="form-group">
          <label for="notes">{{ translate('appointment.field.notes') }}</label>
          <textarea
            id="notes"
            [(ngModel)]="form.notes"
            name="notes"
            class="form-control"
            rows="3"
            [disabled]="loading || saving"
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary" [disabled]="loading || saving">
            {{ translate(submitButtonKey) }}
          </button>
          <button type="button" (click)="cancel()" class="btn-secondary" [disabled]="loading || saving">
            {{ translate('crud.actions.cancel') }}
          </button>
          <button *ngIf="isEditMode" type="button" (click)="deleteAppointment()" class="btn-danger" [disabled]="loading || saving">
            {{ translate('appointment.button.delete') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-container { max-width: 640px; margin: 0 auto; }
    form.loading { opacity: 0.6; pointer-events: none; }
    .error-message, .success-message, .info-message { border-radius: 10px; margin-bottom: 16px; padding: 12px; }
    .error-message { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
    .success-message { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
    .info-message { background-color: #eef6ff; border: 1px solid #d5e5f7; color: #31577e; }
    .form-group { margin-bottom: 16px; }
    .required { color: #dc3545; }
    .form-control { width: 100%; }
    .form-text { color: #6b7280; display: block; margin-top: 4px; }
    .checkbox-label { align-items: center; display: flex; gap: 8px; }
    .form-actions { display: flex; gap: 10px; margin-top: 20px; }
    .btn-primary, .btn-secondary, .btn-danger { border: none; border-radius: 8px; cursor: pointer; font-weight: 600; padding: 10px 14px; }
    .btn-primary { background: #0a6de0; color: #fff; }
    .btn-secondary { background: #6b7280; color: #fff; }
    .btn-danger { background: #c62828; color: #fff; }
    .btn-primary:disabled, .btn-secondary:disabled, .btn-danger:disabled { cursor: not-allowed; opacity: 0.6; }
    @media (max-width: 700px) { .form-actions { flex-direction: column; } }
  `]
})
export class AppointmentFormComponent implements OnInit, OnChanges {
  @Input() embedded = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() appointmentToEdit: Appointment | null = null;
  @Input() therapeuticPlanId: number | null = null;
  @Input() planNurses: AppointmentFormNurse[] = [];

  @Output() appointmentSaved = new EventEmitter<Appointment>();
  @Output() appointmentDeleted = new EventEmitter<number>();
  @Output() cancelled = new EventEmitter<void>();

  appointmentTypes: AppointmentType[] = [];
  form = this.createEmptyForm();
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  estimatedEndTime = '';

  recurrenceTypes: Array<{ value: 'SINGLE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'; label: MessageKey }> = [
    { value: 'SINGLE', label: 'appointment.recurrence.single' },
    { value: 'DAILY', label: 'appointment.recurrence.daily' },
    { value: 'WEEKLY', label: 'appointment.recurrence.weekly' },
    { value: 'MONTHLY', label: 'appointment.recurrence.monthly' }
  ];

  constructor(private readonly appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadAppointmentTypes();
    this.syncFormWithInputs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appointmentToEdit'] || changes['mode']) {
      this.syncFormWithInputs();
    }
  }

  get isEditMode(): boolean {
    return this.mode === 'edit' && this.appointmentToEdit !== null;
  }

  get submitButtonKey(): MessageKey {
    return this.isEditMode ? 'appointment.button.update' : 'appointment.button.create';
  }

  get selectedAppointmentTypeLabel(): string {
    const appointmentTypeId = this.form.appointmentTypeId;
    if (!appointmentTypeId) {
      return this.translate('common.notAvailable');
    }

    const appointmentType = this.appointmentTypes.find((type) => type.id === appointmentTypeId);
    if (!appointmentType) {
      return this.translate('common.notAvailable');
    }

    return `${appointmentType.name} (${appointmentType.durationMinutes}${this.translate('appointment.label.minutes')})`;
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  onAppointmentTypeChange(): void {
    this.calculateEndDateTime();
  }

  onStartDateTimeChange(): void {
    this.calculateEndDateTime();
  }

  isRecurrent(): boolean {
    return this.form.recurrenceType !== 'SINGLE';
  }

  submitForm(): void {
    const therapeuticPlanId = this.resolveTherapeuticPlanId();

    if (!therapeuticPlanId) {
      this.errorMessage = this.translate('appointment.error.therapeuticPlanRequired');
      return;
    }
    if (!this.form.appointmentTypeId) {
      this.errorMessage = this.translate('appointment.error.appointmentTypeRequired');
      return;
    }
    if (!this.form.nurseId) {
      this.errorMessage = this.translate('appointment.error.nurseRequired');
      return;
    }
    if (!this.form.startDateTime) {
      this.errorMessage = this.translate('appointment.error.startDateTimeRequired');
      return;
    }
    if (!this.estimatedEndTime) {
      this.errorMessage = this.translate('appointment.error.endDateTimeRequired');
      return;
    }
    if (this.isRecurrent() && !this.form.recurrenceEndDate) {
      this.errorMessage = this.translate('appointment.error.recurrenceEndDateRequired');
      return;
    }

    const payload: Partial<Appointment> = {
      therapeuticPlanId,
      appointmentTypeId: this.form.appointmentTypeId,
      nurseId: this.form.nurseId,
      startDateTime: this.toLocalDateTimePayload(this.form.startDateTime),
      endDateTime: this.toLocalDateTimePayload(this.estimatedEndTime),
      recurrenceType: this.form.recurrenceType,
      recurrenceEndDate: this.form.recurrenceEndDate || null,
      reminderEnabled: this.form.reminderEnabled,
      reminderMinutesBefore: this.form.reminderMinutesBefore,
      status: this.appointmentToEdit?.status ?? 'SCHEDULED',
      notes: this.form.notes || null
    };

    const request = this.isEditMode && this.appointmentToEdit?.id
      ? this.appointmentService.updateAppointment(this.appointmentToEdit.id, payload)
      : this.appointmentService.createAppointment(payload);

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    request.subscribe({
      next: (saved) => {
        this.saving = false;
        this.successMessage = this.translate(this.isEditMode ? 'appointment.message.updated' : 'appointment.message.created');
        this.appointmentSaved.emit(saved);
      },
      error: (error: unknown) => {
        this.saving = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  deleteAppointment(): void {
    if (!this.isEditMode || !this.appointmentToEdit?.id) {
      return;
    }

    if (!window.confirm(this.translate('appointment.confirm.delete'))) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    this.appointmentService.deleteAppointment(this.appointmentToEdit.id).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = this.translate('appointment.message.deleted');
        this.appointmentDeleted.emit(this.appointmentToEdit?.id ?? 0);
      },
      error: (error: unknown) => {
        this.saving = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  cancel(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.cancelled.emit();
  }

  private loadAppointmentTypes(): void {
    this.loading = true;
    this.appointmentService.getAllAppointmentTypes().subscribe({
      next: (data) => {
        this.appointmentTypes = data;
        this.calculateEndDateTime();
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  private calculateEndDateTime(): void {
    if (!this.form.appointmentTypeId || !this.form.startDateTime) {
      this.estimatedEndTime = '';
      return;
    }

    const selectedType = this.appointmentTypes.find((type) => type.id === Number(this.form.appointmentTypeId));
    if (!selectedType || !selectedType.durationMinutes) {
      this.estimatedEndTime = '';
      return;
    }

    try {
      const startDate = new Date(`${this.form.startDateTime}:00`);
      const endDate = new Date(startDate.getTime() + selectedType.durationMinutes * 60000);
      const year = endDate.getFullYear();
      const month = String(endDate.getMonth() + 1).padStart(2, '0');
      const day = String(endDate.getDate()).padStart(2, '0');
      const hours = String(endDate.getHours()).padStart(2, '0');
      const minutes = String(endDate.getMinutes()).padStart(2, '0');
      this.estimatedEndTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      this.estimatedEndTime = '';
    }
  }

  private createEmptyForm(): {
    appointmentTypeId: number | null;
    nurseId: number | null;
    startDateTime: string;
    recurrenceType: 'SINGLE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    recurrenceEndDate: string | null;
    reminderEnabled: boolean;
    reminderMinutesBefore: number;
    notes: string;
  } {
    return {
      appointmentTypeId: null,
      nurseId: null,
      startDateTime: '',
      recurrenceType: 'SINGLE',
      recurrenceEndDate: null,
      reminderEnabled: true,
      reminderMinutesBefore: 15,
      notes: ''
    };
  }

  private syncFormWithInputs(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.isEditMode || !this.appointmentToEdit) {
      this.form = this.createEmptyForm();
      this.estimatedEndTime = '';
      return;
    }

    this.form = {
      appointmentTypeId: this.appointmentToEdit.appointmentTypeId,
      nurseId: this.appointmentToEdit.nurseId,
      startDateTime: this.toDateTimeLocalValue(this.appointmentToEdit.startDateTime),
      recurrenceType: this.appointmentToEdit.recurrenceType ?? 'SINGLE',
      recurrenceEndDate: this.toDateInputValue(this.appointmentToEdit.recurrenceEndDate),
      reminderEnabled: this.appointmentToEdit.reminderEnabled ?? true,
      reminderMinutesBefore: this.appointmentToEdit.reminderMinutesBefore ?? 15,
      notes: this.appointmentToEdit.notes ?? ''
    };

    this.estimatedEndTime = this.toDateTimeLocalValue(this.appointmentToEdit.endDateTime);
    this.calculateEndDateTime();
  }

  private resolveTherapeuticPlanId(): number | null {
    return this.therapeuticPlanId ?? this.appointmentToEdit?.therapeuticPlanId ?? null;
  }

  private toDateTimeLocalValue(dateTime: string | null | undefined): string {
    if (!dateTime) {
      return '';
    }

    const parsedDate = new Date(dateTime);
    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const hours = String(parsedDate.getHours()).padStart(2, '0');
    const minutes = String(parsedDate.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private toDateInputValue(dateValue: string | null | undefined): string | null {
    if (!dateValue) {
      return null;
    }

    return dateValue.slice(0, 10);
  }

  private toLocalDateTimePayload(dateTime: string): string {
    return dateTime.length === 16 ? `${dateTime}:00` : dateTime;
  }

  private resolveErrorMessage(error: unknown): string {
    const typedError = error as { error?: { detail?: string; message?: string } };
    const detail = typeof typedError?.error?.detail === 'string' ? typedError.error.detail.trim() : '';
    if (detail) {
      return detail;
    }
    const message = typeof typedError?.error?.message === 'string' ? typedError.error.message.trim() : '';
    if (message) {
      return message;
    }
    return this.translate('crud.error.create');
  }
}