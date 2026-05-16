import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService, Appointment, AppointmentType } from '../../services/appointment.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.css']
})
export class AppointmentFormComponent implements OnInit {
  @Input() therapeuticPlanId: number | null = null;
  @Input() planNurses: any[] = []; // Array di infermieri del piano

  appointmentTypes: AppointmentType[] = [];
  form = {
    appointmentTypeId: null as number | null,
    nurseId: null as number | null,
    startDateTime: '' as string,
    recurrenceType: 'SINGLE' as string,
    recurrenceEndDate: null as string | null,
    reminderEnabled: true as boolean,
    reminderMinutesBefore: 15 as number,
    notes: '' as string
  };

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
    private appointmentService: AppointmentService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadAppointmentTypes();
  }

  loadAppointmentTypes(): void {
    this.loading = true;
    this.appointmentService.getAllAppointmentTypes().subscribe({
      next: (data) => {
        this.appointmentTypes = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  onAppointmentTypeChange(): void {
    if (!this.form.appointmentTypeId || !this.form.startDateTime) {
      this.estimatedEndTime = '';
      return;
    }

    const selectedType = this.appointmentTypes.find(t => t.id === this.form.appointmentTypeId);
    if (!selectedType) {
      return;
    }

    // Calcola l'ora di fine basata sulla durata del tipo appuntamento
    const startDate = new Date(this.form.startDateTime);
    const endDate = new Date(startDate.getTime() + selectedType.durationMinutes * 60000);
    this.estimatedEndTime = endDate.toISOString().substring(0, 16);
  }

  onStartDateTimeChange(): void {
    this.onAppointmentTypeChange();
  }

  isRecurrent(): boolean {
    return this.form.recurrenceType !== 'SINGLE';
  }

  submitForm(): void {
    // Validazioni base
    if (!this.therapeuticPlanId) {
      this.errorMessage = this.translate.instant('appointment.error.therapeuticPlanRequired');
      return;
    }
    if (!this.form.appointmentTypeId) {
      this.errorMessage = this.translate.instant('appointment.error.appointmentTypeRequired');
      return;
    }
    if (!this.form.nurseId) {
      this.errorMessage = this.translate.instant('appointment.error.nurseRequired');
      return;
    }
    if (!this.form.startDateTime) {
      this.errorMessage = this.translate.instant('appointment.error.startDateTimeRequired');
      return;
    }
    if (!this.estimatedEndTime) {
      this.errorMessage = this.translate.instant('appointment.error.endDateTimeRequired');
      return;
    }
    if (this.isRecurrent() && !this.form.recurrenceEndDate) {
      this.errorMessage = this.translate.instant('appointment.error.recurrenceEndDateRequired');
      return;
    }

    // Prepara il payload
    const selectedType = this.appointmentTypes.find(t => t.id === this.form.appointmentTypeId);
    const payload = {
      therapeuticPlanId: this.therapeuticPlanId,
      appointmentTypeId: this.form.appointmentTypeId,
      nurseId: this.form.nurseId,
      startDateTime: new Date(this.form.startDateTime).toISOString(),
      endDateTime: new Date(this.estimatedEndTime).toISOString(),
      recurrenceType: this.form.recurrenceType,
      recurrenceEndDate: this.form.recurrenceEndDate || null,
      reminderEnabled: this.form.reminderEnabled,
      reminderMinutesBefore: this.form.reminderMinutesBefore,
      notes: this.form.notes || null
    };

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.appointmentService.createAppointment(payload).subscribe({
      next: (created) => {
        this.saving = false;
        this.successMessage = this.translate.instant('appointment.message.created');
        this.resetForm();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  resetForm(): void {
    this.form = {
      appointmentTypeId: null,
      nurseId: null,
      startDateTime: '',
      recurrenceType: 'SINGLE',
      recurrenceEndDate: null,
      reminderEnabled: true,
      reminderMinutesBefore: 15,
      notes: ''
    };
    this.estimatedEndTime = '';
  }

  private resolveErrorMessage(error: any): string {
    const detail = typeof error?.error?.detail === 'string' ? error.error.detail.trim() : '';
    if (detail) {
      return detail;
    }
    const message = typeof error?.error?.message === 'string' ? error.error.message.trim() : '';
    if (message) {
      return message;
    }
    return this.translate.instant('crud.error.save');
  }
}
