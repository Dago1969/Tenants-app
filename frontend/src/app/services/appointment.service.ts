import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppointmentType {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface Appointment {
  id: number;
  therapeuticPlanId: number | null;
  therapeuticPlanPatientDisplayName?: string | null;
  appointmentTypeId: number | null;
  appointmentTypeName: string;
  appointmentTypeDurationMinutes?: number | null;
  nurseId: number | null;
  nurseName: string;
  startDateTime: string;
  endDateTime: string;
  recurrenceType?: 'SINGLE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceEndDate?: string | null;
  reminderEnabled?: boolean;
  reminderMinutesBefore?: number;
  status: string;
  notes: string | null;
  appointmentCategory?: string | null;
  patientFirstName?: string | null;
  patientLastName?: string | null;
  patientFiscalCode?: string | null;
  patientPhone?: string | null;
  caregiverPhone?: string | null;
  patientAddress?: string | null;
  address?: string | null;
  city?: string | null;
  facility?: string | null;
  patientCode?: string | null;
  patientName?: string | null;
  dischargeType?: string | null;
  dischargeDate?: string | null;
  prevalentDoctorCode?: string | null;
  prevalentDoctorName?: string | null;
}

export interface CurrentNurse {
  id: number;
  fullName: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiBaseUrl}/appointments`;

  getAllAppointmentTypes(): Observable<AppointmentType[]> {
    return this.http.get<AppointmentType[]>(`${this.apiBase}/types`);
  }

  createAppointmentType(payload: Partial<AppointmentType>): Observable<AppointmentType> {
    return this.http.post<AppointmentType>(`${this.apiBase}/types`, payload);
  }

  updateAppointmentType(appointmentTypeId: number, payload: Partial<AppointmentType>): Observable<AppointmentType> {
    return this.http.put<AppointmentType>(`${this.apiBase}/types/${appointmentTypeId}`, payload);
  }

  deleteAppointmentType(appointmentTypeId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/types/${appointmentTypeId}`);
  }

  createAppointment(payload: Partial<Appointment>): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiBase, payload);
  }

  getByTherapeuticPlan(therapeuticPlanId: number): Observable<Appointment[]> {
    if (!therapeuticPlanId) {
      return of([]);
    }

    return this.http.get<Appointment[]>(`${this.apiBase}/therapeutic-plan/${therapeuticPlanId}`);
  }

  updateAppointment(appointmentId: number, payload: Partial<Appointment>): Observable<Appointment> {
    if (!appointmentId) {
      return of(payload as Appointment);
    }

    return this.http.put<Appointment>(`${this.apiBase}/${appointmentId}`, payload);
  }

  deleteAppointment(appointmentId: number): Observable<void> {
    if (!appointmentId) {
      return of(void 0);
    }

    return this.http.delete<void>(`${this.apiBase}/${appointmentId}`);
  }

  getByNurseAndDateRange(nurseId: number, startDate: Date, endDate: Date): Observable<Appointment[]> {
    const params = new HttpParams()
      .set('startDate', this.formatDate(startDate))
      .set('endDate', this.formatDate(endDate));
    return this.http.get<Appointment[]>(`${this.apiBase}/nurse/${nurseId}/calendar`, { params });
  }

  getCurrentNurse(): Observable<CurrentNurse> {
    return this.http.get<CurrentNurse>(`${environment.apiBaseUrl}/nurses/me`);
  }

  getByNurseAndDate(nurseId: number, date?: Date): Observable<Appointment[]> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', this.formatDate(date));
    }
    return this.http.get<Appointment[]>(`${this.apiBase}/nurse/${nurseId}/daily`, { params });
  }

  getNurseDashboardDaily(nurseId: number, date: Date): Observable<Appointment[]> {
    const params = new HttpParams()
      .set('nurseId', nurseId)
      .set('date', this.formatDate(date));
    console.log('[NurseDashboard] Richiesta appuntamenti per la data:', this.formatDate(date));
    return this.http.get<Appointment[]>(`${environment.apiBaseUrl}/appointments/dashboard/nurse/appointments/daily`, { params });
  }

  getNurseDashboardCalendar(nurseId: number, month: number, year: number): Observable<Appointment[]> {
    const params = new HttpParams()
      .set('nurseId', nurseId)
      .set('month', month)
      .set('year', year);
    console.log('[NurseDashboard] Richiesta appuntamenti per il mese:', { month, year });
    return this.http.get<Appointment[]>(`${environment.apiBaseUrl}/appointments/dashboard/nurse/appointments/calendar`, { params });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}