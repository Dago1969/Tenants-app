import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Appointment, AppointmentService } from '../../../services/appointment.service';
import { MessageKey, t } from '../../../i18n/messages';

@Component({
  selector: 'app-appointments-daily',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="daily-shell">
      <header class="daily-header">
        <h2>{{ translate('appointment.title.daily') }}</h2>
        <div class="daily-actions">
          <button type="button" class="btn btn-outline" (click)="previousDay()">&lt;</button>
          <input type="date" [ngModel]="selectedDateInput" (ngModelChange)="onDateInputChange($event)" />
          <button type="button" class="btn btn-outline" (click)="nextDay()">&gt;</button>
          <button type="button" class="btn btn-outline" (click)="goToToday()">{{ translate('appointment.button.today') }}</button>
        </div>
      </header>

      <div *ngIf="errorMessage" class="daily-error">{{ errorMessage }}</div>

      <p *ngIf="!errorMessage && appointments.length === 0">{{ translate('appointment.message.noAppointments') }}</p>

      <table *ngIf="appointments.length > 0" class="daily-table">
        <thead>
          <tr>
            <th>{{ translate('appointment.field.startDateTime') }}</th>
            <th>{{ translate('appointment.field.endDateTime') }}</th>
            <th>{{ translate('appointment.field.type') }}</th>
            <th>{{ translate('appointment.field.patient') }}</th>
            <th>{{ translate('search.column.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let appointment of appointments">
            <td>{{ formatTime(appointment.startDateTime) }}</td>
            <td>{{ formatTime(appointment.endDateTime) }}</td>
            <td>{{ appointment.appointmentTypeName || '-' }}</td>
            <td>{{ appointment.therapeuticPlanId || '-' }}</td>
            <td>{{ getStatusLabel(appointment.status) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  `,
  styles: [`
    .daily-shell { display: grid; gap: 12px; }
    .daily-header { align-items: center; display: flex; justify-content: space-between; }
    .daily-actions { align-items: center; display: flex; gap: 8px; }
    .daily-error { background: #fee2e2; border: 1px solid #fecaca; border-radius: 10px; color: #991b1b; padding: 10px; }
    .daily-table { border-collapse: collapse; width: 100%; }
    .daily-table th, .daily-table td { border-bottom: 1px solid #e2e8f0; padding: 8px; text-align: left; }
  `]
})
export class AppointmentsDailyComponent {
  appointments: Appointment[] = [];
  selectedDate: Date = new Date();
  nurseId: number | null = null;
  loading = false;
  errorMessage = '';

  constructor(private readonly appointmentService: AppointmentService) {
    this.loadAppointments();
  }

  get selectedDateInput(): string {
    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(this.selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  onDateInputChange(value: string): void {
    this.selectedDate = value ? new Date(`${value}T00:00:00`) : new Date();
    this.loadAppointments();
  }

  goToToday(): void {
    this.selectedDate = new Date();
    this.loadAppointments();
  }

  previousDay(): void {
    const date = new Date(this.selectedDate);
    date.setDate(date.getDate() - 1);
    this.selectedDate = date;
    this.loadAppointments();
  }

  nextDay(): void {
    const date = new Date(this.selectedDate);
    date.setDate(date.getDate() + 1);
    this.selectedDate = date;
    this.loadAppointments();
  }

  formatTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getStatusLabel(status: string): string {
    const normalizedStatus = (status ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const statusKeyByValue: Record<string, MessageKey> = {
      scheduled: 'appointment.status.scheduled',
      completed: 'appointment.status.completed',
      cancelled: 'appointment.status.cancelled',
      in_progress: 'appointment.status.in_progress'
    };

    const statusKey = statusKeyByValue[normalizedStatus];
    return statusKey ? this.translate(statusKey) : status;
  }

  private loadAppointments(): void {
    if (!this.nurseId) {
      this.errorMessage = this.translate('appointment.error.nurseNotConfigured');
      this.appointments = [];
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.appointmentService.getByNurseAndDate(this.nurseId, this.selectedDate).subscribe({
      next: (items) => {
        this.appointments = items;
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
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
    return this.translate('crud.error.load');
  }
}