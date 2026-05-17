import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService, Appointment, AppointmentType } from '../../../services/appointment.service';
import { MessageKey, t } from '../../../i18n/messages';

/**
 * Component per creare un nuovo appuntamento nel piano terapeutico.
 * Permette di selezionare:
 * - Tipo appuntamento (con durata)
 * - Infermiere assegnato al piano
 * - Data/ora inizio
 * - Tipo di ricorrenza (SINGLE, DAILY, WEEKLY, MONTHLY)
 * - Data fine ricorrenza (se ricorrente)
 * - Abilitazione promemoria con tempo anticipo
 */
@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.css']
})
export class AppointmentFormComponent implements OnInit, OnChanges {
  @Input() therapeuticPlanId: number | null = null;
  @Input() planNurses: any[] = []; // Array di infermieri del piano
  @Input() embedded = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() appointmentToEdit: Appointment | null = null;
  @Output() appointmentCreated = new EventEmitter<Appointment>();
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

  recurrenceTypes = [
    { value: 'SINGLE', label: 'appointment.recurrence.single' },
    { value: 'DAILY', label: 'appointment.recurrence.daily' },
    { value: 'WEEKLY', label: 'appointment.recurrence.weekly' },
    { value: 'MONTHLY', label: 'appointment.recurrence.monthly' }
  ];

  constructor(
    private readonly appointmentService: AppointmentService
  ) {}

  get isEditMode(): boolean {
    return this.mode === 'edit' && this.appointmentToEdit !== null;
  }

  get titleKey(): MessageKey {
    return this.isEditMode ? 'appointment.title.edit' : 'appointment.title.create';
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

    return `${appointmentType.name} (${appointmentType.durationMinutes}min)`;
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  ngOnInit(): void {
    this.loadAppointmentTypes();
    this.syncFormWithInputs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appointmentToEdit'] || changes['mode']) {
      this.syncFormWithInputs();
    }
  }

  loadAppointmentTypes(): void {
    this.loading = true;
    this.appointmentService.getAllAppointmentTypes().subscribe({
      next: (data: AppointmentType[]) => {
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

  onAppointmentTypeChange(): void {
    this.calculateEndDateTime();
  }

  onStartDateTimeChange(): void {
    this.calculateEndDateTime();
  }

  /**
   * Calcola l'ora di fine appuntamento in base alla durata del tipo selezionato e all'ora di inizio.
   * Gestisce correttamente il formato datetime-local HTML.
   */
  private calculateEndDateTime(): void {
    // Validazione: devono essere presenti tipo appuntamento e ora inizio
    if (!this.form.appointmentTypeId || !this.form.startDateTime) {
      this.estimatedEndTime = '';
      return;
    }

    const appointmentTypeId = Number(this.form.appointmentTypeId);
    if (Number.isNaN(appointmentTypeId)) {
      this.estimatedEndTime = '';
      return;
    }

    const selectedType = this.appointmentTypes.find(t => t.id === appointmentTypeId);
    if (!selectedType || !selectedType.durationMinutes) {
      this.estimatedEndTime = '';
      return;
    }

    try {
      this.estimatedEndTime = this.appointmentService.addMinutesToDateTimeLocalValue(
        this.form.startDateTime,
        selectedType.durationMinutes
      );
    } catch {
      this.estimatedEndTime = '';
    }
  }

  isRecurrent(): boolean {
    return this.form.recurrenceType !== 'SINGLE';
  }

  submitForm(): void {
    const therapeuticPlanId = this.resolveTherapeuticPlanId();

    // Validazioni base
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

    const payload = {
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
      next: (saved: Appointment) => {
        this.saving = false;
        this.successMessage = this.translate(this.isEditMode ? 'appointment.message.updated' : 'appointment.message.created');
        if (!this.isEditMode) {
          this.appointmentCreated.emit(saved);
          this.resetForm();
        }
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

  resetForm(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEditMode) {
      this.syncFormWithInputs();
      return;
    }

    this.form = this.createEmptyForm();
    this.estimatedEndTime = '';
  }

  private createEmptyForm() {
    return {
      appointmentTypeId: null as number | null,
      nurseId: null as number | null,
      startDateTime: '' as string,
      recurrenceType: 'SINGLE' as Appointment['recurrenceType'],
      recurrenceEndDate: null as string | null,
      reminderEnabled: true as boolean,
      reminderMinutesBefore: 15 as number,
      notes: '' as string
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
      recurrenceType: this.appointmentToEdit.recurrenceType,
      recurrenceEndDate: this.toDateInputValue(this.appointmentToEdit.recurrenceEndDate),
      reminderEnabled: this.appointmentToEdit.reminderEnabled,
      reminderMinutesBefore: this.appointmentToEdit.reminderMinutesBefore,
      notes: this.appointmentToEdit.notes ?? ''
    };

    this.estimatedEndTime = this.toDateTimeLocalValue(this.appointmentToEdit.endDateTime);
    this.calculateEndDateTime();
  }

  private resolveTherapeuticPlanId(): number | null {
    return this.therapeuticPlanId ?? this.appointmentToEdit?.therapeuticPlanId ?? null;
  }

  private toDateTimeLocalValue(dateTime: string | null | undefined): string {
    return this.appointmentService.toDateTimeLocalValue(dateTime);
  }

  private toDateInputValue(dateValue: string | null | undefined): string | null {
    if (!dateValue) {
      return null;
    }

    return dateValue.slice(0, 10);
  }

  private toLocalDateTimePayload(dateTime: string): string {
    return this.appointmentService.toLocalDateTimePayload(dateTime);
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
    return this.translate('crud.error.save');
  }
}
