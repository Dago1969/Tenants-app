import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Appointment, AppointmentService } from '../../../services/appointment.service';
import { MessageKey, t } from '../../../i18n/messages';

@Component({
  selector: 'app-appointments-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="calendar-shell">
      <header class="calendar-header">
        <h2>{{ translate('appointment.title.calendar') }}</h2>
        <div class="calendar-actions">
          <button type="button" class="btn btn-outline" (click)="previousMonth()">&lt;</button>
          <button type="button" class="btn btn-outline" (click)="goToToday()">{{ translate('appointment.button.today') }}</button>
          <button type="button" class="btn btn-outline" (click)="nextMonth()">&gt;</button>
        </div>
      </header>

      <p class="calendar-month">{{ monthYear }}</p>

      <div *ngIf="errorMessage" class="calendar-error">{{ errorMessage }}</div>

      <div class="calendar-grid">
        <div class="calendar-weekday" *ngFor="let day of weekDays">{{ day }}</div>
        <div
          class="calendar-day"
          *ngFor="let day of daysInMonth"
          [class.calendar-day-empty]="day === null"
          [class.calendar-day-today]="isToday(day)"
        >
          <ng-container *ngIf="day !== null">
            <div class="calendar-day-label">{{ day }}</div>
            <div class="calendar-day-count" *ngIf="getApptCountForDay(day) > 0">
              {{ getApptCountForDay(day) }} {{ translate('appointment.label.appointments') }}
            </div>
          </ng-container>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .calendar-shell { display: grid; gap: 12px; }
    .calendar-header { align-items: center; display: flex; justify-content: space-between; }
    .calendar-actions { display: flex; gap: 8px; }
    .calendar-month { font-weight: 700; margin: 0; text-transform: capitalize; }
    .calendar-error { background: #fee2e2; border: 1px solid #fecaca; border-radius: 10px; color: #991b1b; padding: 10px; }
    .calendar-grid { display: grid; gap: 8px; grid-template-columns: repeat(7, minmax(0, 1fr)); }
    .calendar-weekday { color: #475569; font-size: 12px; font-weight: 700; text-align: center; }
    .calendar-day { background: #fff; border: 1px solid #dbe4f0; border-radius: 10px; min-height: 78px; padding: 8px; }
    .calendar-day-empty { background: #f8fafc; border-style: dashed; }
    .calendar-day-today { border-color: #1d4ed8; box-shadow: 0 0 0 1px #1d4ed8 inset; }
    .calendar-day-label { font-weight: 700; }
    .calendar-day-count { color: #1d4ed8; font-size: 12px; margin-top: 6px; }
  `]
})
export class AppointmentsCalendarComponent implements OnInit {
  @Input() nurseId: number | null = null;

  currentDate = new Date();
  appointments: Appointment[] = [];
  loading = false;
  errorMessage = '';
  daysInMonth: Array<number | null> = [];
  monthYear = '';
  appointmentsByDay: Map<number, Appointment[]> = new Map();
  weekDays = [
    t('appointment.weekDay.sun'),
    t('appointment.weekDay.mon'),
    t('appointment.weekDay.tue'),
    t('appointment.weekDay.wed'),
    t('appointment.weekDay.thu'),
    t('appointment.weekDay.fri'),
    t('appointment.weekDay.sat')
  ];

  constructor(private readonly appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.generateCalendar();
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    this.monthYear = new Date(year, month).toLocaleString([], { month: 'long', year: 'numeric' });
    this.loadAppointmentsForMonth(year, month);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    this.daysInMonth = [];
    for (let i = 0; i < firstDay; i += 1) {
      this.daysInMonth.push(null);
    }
    for (let day = 1; day <= daysInCurrentMonth; day += 1) {
      this.daysInMonth.push(day);
    }
  }

  loadAppointmentsForMonth(year: number, month: number): void {
    if (!this.nurseId) {
      this.errorMessage = this.translate('appointment.error.nurseNotConfigured');
      this.appointments = [];
      this.appointmentsByDay.clear();
      return;
    }

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    this.loading = true;
    this.errorMessage = '';

    this.appointmentService.getByNurseAndDateRange(this.nurseId, startDate, endDate).subscribe({
      next: (items) => {
        this.appointments = items;
        this.groupAppointmentsByDay(items);
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1);
    this.generateCalendar();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.generateCalendar();
  }

  getApptCountForDay(day: number | null): number {
    if (day === null) {
      return 0;
    }
    return this.appointmentsByDay.get(day)?.length ?? 0;
  }

  isToday(day: number | null): boolean {
    if (day === null) {
      return false;
    }
    const today = new Date();
    return day === today.getDate()
      && this.currentDate.getMonth() === today.getMonth()
      && this.currentDate.getFullYear() === today.getFullYear();
  }

  private groupAppointmentsByDay(appointments: Appointment[]): void {
    this.appointmentsByDay.clear();
    appointments.forEach((appointment) => {
      const currentDate = new Date(appointment.startDateTime);
      const day = currentDate.getDate();
      if (!this.appointmentsByDay.has(day)) {
        this.appointmentsByDay.set(day, []);
      }
      this.appointmentsByDay.get(day)?.push(appointment);
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