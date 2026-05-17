import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService, Appointment } from '../../../services/appointment.service';
import { CurrentNurseService } from '../../../services/current-nurse.service';
import { MessageKey, t } from '../../../i18n/messages';

/**
 * Component per visualizzare gli appuntamenti di un infermiere in un calendario mensile.
 * Permette di navigare tra i mesi e vedere gli appuntamenti giornalieri.
 */
@Component({
  selector: 'app-appointments-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointments-calendar.component.html',
  styleUrls: ['./appointments-calendar.component.css']
})
export class AppointmentsCalendarComponent implements OnInit {
  @Input() nurseId: number | null = null;

  currentDate: Date = new Date();
  appointments: Appointment[] = [];
  loading = false;
  errorMessage = '';

  // Proprietà calendario
  daysInMonth: (number | null)[] = [];
  monthYear = '';
  weekDayKeys: MessageKey[] = [
    'appointment.weekDay.sun',
    'appointment.weekDay.mon',
    'appointment.weekDay.tue',
    'appointment.weekDay.wed',
    'appointment.weekDay.thu',
    'appointment.weekDay.fri',
    'appointment.weekDay.sat'
  ];
  appointmentsByDay: Map<number, Appointment[]> = new Map();

  constructor(
    private appointmentService: AppointmentService,
    private currentNurseService: CurrentNurseService
  ) {}

  translate(key: MessageKey): string {
    return t(key);
  }

  ngOnInit(): void {
    if (this.nurseId) {
      this.generateCalendar();
      return;
    }

    this.loading = true;
    this.currentNurseService.resolveCurrentNurseId().subscribe({
      next: (nurseId) => {
        this.nurseId = nurseId;
        if (this.nurseId) {
          this.generateCalendar();
          return;
        }

        this.loading = false;
        this.errorMessage = t('appointment.error.nurseNotConfigured');
      },
      error: () => {
        this.loading = false;
        this.errorMessage = t('appointment.error.nurseNotConfigured');
      }
    });
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    this.monthYear = new Date(year, month).toLocaleString([], { month: 'long', year: 'numeric' });

    // Carica appuntamenti per il mese
    this.loadAppointmentsForMonth(year, month);

    // Genera giorni del calendario
    const firstDay = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

    this.daysInMonth = [];
    for (let i = 0; i < firstDay; i++) {
      this.daysInMonth.push(null);
    }
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      this.daysInMonth.push(i);
    }
  }

  loadAppointmentsForMonth(year: number, month: number): void {
    if (!this.nurseId) {
      this.errorMessage = t('appointment.error.nurseNotConfigured');
      return;
    }

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    this.loading = true;
    this.errorMessage = '';
    this.appointmentService.getByNurseAndDateRange(this.nurseId, startDate, endDate).subscribe({
      next: (data) => {
        this.appointments = data;
        this.groupAppointmentsByDay(data);
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  groupAppointmentsByDay(appointments: Appointment[]): void {
    this.appointmentsByDay.clear();
    appointments.forEach(apt => {
      const day = this.appointmentService.getDayOfMonth(apt.startDateTime);
      if (day === null) {
        return;
      }
      if (!this.appointmentsByDay.has(day)) {
        this.appointmentsByDay.set(day, []);
      }
      this.appointmentsByDay.get(day)!.push(apt);
    });
  }

  getFormattedTime(value: string): string {
    return this.appointmentService.formatLocalTime(value);
  }

  getStatusLabel(status: string): MessageKey {
    return `appointment.status.${status.toLowerCase()}` as MessageKey;
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

  getAppointmentsForDay(day: number | null): Appointment[] {
    if (day === null) {
      return [];
    }
    return this.appointmentsByDay.get(day) || [];
  }

  getApptCountForDay(day: number | null): number {
    return this.getAppointmentsForDay(day).length;
  }

  isToday(day: number | null): boolean {
    if (day === null) {
      return false;
    }
    const today = new Date();
    return (
      day === today.getDate() &&
      this.currentDate.getMonth() === today.getMonth() &&
      this.currentDate.getFullYear() === today.getFullYear()
    );
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
    return t('crud.error.load');
  }
}
