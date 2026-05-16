import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/**
 * Component per visualizzare gli appuntamenti di un infermiere per una giornata specifica.
 * Permette di selezionare la data e vedere gli appuntamenti per quel giorno.
 * Se l'utente è NURSE_QTM, vede i propri appuntamenti.
 */
@Component({
  selector: 'app-appointments-daily',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
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
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // TODO: Recuperare nurseId dal context utente (NURSE_QTM)
    // this.nurseId = this.currentUserService.getCurrentNurseId();
    this.loadAppointments();
  }

  loadAppointments(): void {
    if (!this.nurseId) {
      this.errorMessage = 'Infermiere non configurato';
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
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getDurationInMinutes(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  }

  getStatusLabel(status: string): string {
    return `appointment.status.${status.toLowerCase()}`;
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
    return this.translate.instant('crud.error.load');
  }
}
