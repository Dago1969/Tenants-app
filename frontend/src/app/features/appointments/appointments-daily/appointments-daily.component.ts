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

      <div class="daily-table-wrap" *ngIf="appointments.length > 0">
        <table class="daily-table">
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
      </div>
    </section>
  `,
  styles: [`
    .daily-shell { display: grid; gap: 12px; min-width: 0; }
    .daily-header { align-items: center; display: flex; flex-wrap: wrap; gap: 10px 16px; justify-content: space-between; margin-bottom: 4px; }
    .daily-header h2 { flex: 1 1 180px; margin: 0; min-width: 0; }
    .daily-actions { align-items: center; display: flex; flex: 0 1 auto; flex-wrap: wrap; gap: 8px; }
    .daily-actions button, .daily-actions input { box-sizing: border-box; font-size: 0.85rem; height: 32px; line-height: 22px; padding: 4px 12px; }
    .daily-actions input { min-width: 132px; }
    .daily-error { background: #fee2e2; border: 1px solid #fecaca; border-radius: 10px; color: #991b1b; padding: 10px; }
    .daily-table-wrap { max-width: 100%; overflow-x: auto; }
    .daily-table { border-collapse: collapse; min-width: 520px; width: 100%; }
    .daily-table th, .daily-table td { border-bottom: 1px solid #e2e8f0; padding: 8px; text-align: left; white-space: nowrap; }
    .daily-table th { background-color: #f5f5f5; font-weight: 700; }
  `]
})
export class AppointmentsDailyComponent {
  appointments: Appointment[] = [];
  selectedDate: Date = new Date();
  nurseId: number | null = null;
  loading = false;
  errorMessage = '';

  constructor(private readonly appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.appointmentService.getCurrentNurse().subscribe({
      next: (nurse) => {
        this.nurseId = nurse.id;
        this.loadAppointments();
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
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
    this.appointmentService.getNurseDashboardDaily(this.nurseId, this.selectedDate).subscribe({
      next: (items) => {
        console.log('[NurseDashboard] Risposta ricevuta dal server per appuntamenti giornalieri:', items);
        console.log('[NurseDashboard] Numero appuntamenti ricevuti:', items?.length || 0);
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