import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppointmentService, Appointment } from '../../../services/appointment.service';
import { AuthService } from '../../../core/auth.service';
import { CurrentNurseService } from '../../../services/current-nurse.service';
import { MessageKey, t } from '../../../i18n/messages';

/**
 * Component per visualizzare gli appuntamenti di un infermiere per una giornata specifica.
 * Permette di selezionare la data e vedere gli appuntamenti per quel giorno.
 * Se l'utente è NURSE_QTM, vede i propri appuntamenti.
 */
@Component({
  selector: 'app-appointments-daily',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointments-daily.component.html',
  styleUrls: ['./appointments-daily.component.css']
})
export class AppointmentsDailyComponent implements OnInit {
  appointments: Appointment[] = [];
  selectedDate: Date = new Date();
  loading = false;
  errorMessage = '';
  nurseId: number | null = null;

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private currentNurseService: CurrentNurseService,
    private router: Router
  ) {}

  translate(key: MessageKey): string {
    return t(key);
  }

  ngOnInit(): void {
    this.loading = true;
    this.currentNurseService.resolveCurrentNurseId().subscribe({
      next: (nurseId) => {
        this.nurseId = nurseId;
        if (this.nurseId) {
          this.loadAppointments();
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

  loadAppointments(): void {
    if (!this.nurseId) {
      this.errorMessage = t('appointment.error.nurseNotConfigured');
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.appointmentService.getByNurseAndDate(this.nurseId, this.selectedDate).subscribe({
      next: (data) => {
        this.appointments = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error);
      }
    });
  }

  onDateChange(): void {
    this.loadAppointments();
  }

  goToToday(): void {
    this.selectedDate = new Date();
    this.loadAppointments();
  }

  previousDay(): void {
    this.selectedDate = new Date(this.selectedDate);
    this.selectedDate.setDate(this.selectedDate.getDate() - 1);
    this.loadAppointments();
  }

  nextDay(): void {
    this.selectedDate = new Date(this.selectedDate);
    this.selectedDate.setDate(this.selectedDate.getDate() + 1);
    this.loadAppointments();
  }

  getFormattedDate(dateString: string): string {
    return this.appointmentService.formatLocalTime(dateString);
  }

  getDurationInMinutes(start: string, end: string): number {
    return this.appointmentService.getDurationInMinutes(start, end);
  }

  getStatusLabel(status: string): MessageKey {
    return `appointment.status.${status.toLowerCase()}` as MessageKey;
  }

  viewAppointmentDetails(appointment: Appointment): void {
    // Naviga al dettaglio appuntamento passando il therapeuticPlanId
    this.router.navigate(['/appointments/details', appointment.therapeuticPlanId], {
      queryParams: { appointmentId: appointment.id }
    });
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
