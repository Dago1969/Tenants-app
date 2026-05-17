import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  formatQtmLocalDate,
  formatQtmLocalDateTime,
  formatQtmLocalTime,
  getQtmCurrentLocalDateTimePayload,
  getQtmDayOfMonth,
  getQtmDurationInMinutes,
  parseQtmLocalDateTime,
  toQtmDateTimeLocalValue,
  toQtmLocalDateTimePayload,
  addMinutesToQtmDateTimeLocalValue
} from '../shared/local-date-time.util';

export interface AppointmentType {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface Appointment {
  id: number;
  therapeuticPlanId: number;
  therapeuticPlanPatientDisplayName: string;
  appointmentTypeId: number;
  appointmentTypeName: string;
  appointmentTypeDurationMinutes: number;
  nurseId: number;
  nurseName: string;
  startDateTime: string;
  endDateTime: string;
  recurrenceType: 'SINGLE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceEndDate: string | null;
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
  status: string;
  notes: string | null;
}

/**
 * Service per la gestione delle API degli appuntamenti.
 */
@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiBase = `${environment.apiBaseUrl}/appointments`;

  constructor(private http: HttpClient) {}

  // ==================== AppointmentType ====================

  getAllAppointmentTypes(): Observable<AppointmentType[]> {
    return this.http.get<AppointmentType[]>(`${this.apiBase}/types`);
  }

  createAppointmentType(dto: Partial<AppointmentType>): Observable<AppointmentType> {
    return this.http.post<AppointmentType>(`${this.apiBase}/types`, dto);
  }

  updateAppointmentType(id: number, dto: Partial<AppointmentType>): Observable<AppointmentType> {
    return this.http.put<AppointmentType>(`${this.apiBase}/types/${id}`, dto);
  }

  deleteAppointmentType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/types/${id}`);
  }

  // ==================== Appointment ====================

  createAppointment(dto: Partial<Appointment>): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiBase, dto);
  }

  updateAppointment(id: number, dto: Partial<Appointment>): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiBase}/${id}`, dto);
  }

  deleteAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }

  // ==================== Query ====================

  getByTherapeuticPlan(planId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiBase}/therapeutic-plan/${planId}`);
  }

  /**
   * Recupera gli appuntamenti di un infermiere per una giornata.
   * Se date non è passata, il backend usa oggi.
   */
  getByNurseAndDate(nurseId: number, date?: Date): Observable<Appointment[]> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', this.formatDate(date));
    }
    return this.http.get<Appointment[]>(`${this.apiBase}/nurse/${nurseId}/daily`, { params });
  }

  /**
   * Recupera gli appuntamenti di un infermiere per un intervallo di date (calendario).
   */
  getByNurseAndDateRange(nurseId: number, startDate: Date, endDate: Date): Observable<Appointment[]> {
    const params = new HttpParams()
      .set('startDate', this.formatDate(startDate))
      .set('endDate', this.formatDate(endDate));
    return this.http.get<Appointment[]>(`${this.apiBase}/nurse/${nurseId}/calendar`, { params });
  }

  /**
   * Recupera gli appuntamenti di un piano terapeutico per un intervallo di date.
   */
  getByTherapeuticPlanAndDateRange(planId: number, startDate: Date, endDate: Date): Observable<Appointment[]> {
    const params = new HttpParams()
      .set('startDate', this.formatDate(startDate))
      .set('endDate', this.formatDate(endDate));
    return this.http.get<Appointment[]>(`${this.apiBase}/therapeutic-plan/${planId}/range`, { params });
  }

  parseLocalDateTime(value?: string | null): Date | null {
    return parseQtmLocalDateTime(value);
  }

  formatLocalDateTime(value?: string | null): string {
    return formatQtmLocalDateTime(value);
  }

  formatLocalDate(value?: string | null): string {
    return formatQtmLocalDate(value);
  }

  formatLocalTime(value?: string | null): string {
    return formatQtmLocalTime(value);
  }

  getDurationInMinutes(start?: string | null, end?: string | null): number {
    return getQtmDurationInMinutes(start, end);
  }

  getDayOfMonth(value?: string | null): number | null {
    return getQtmDayOfMonth(value);
  }

  toDateTimeLocalValue(dateTime?: string | null): string {
    return toQtmDateTimeLocalValue(dateTime);
  }

  toLocalDateTimePayload(dateTime: string): string {
    return toQtmLocalDateTimePayload(dateTime);
  }

  getCurrentLocalDateTimePayload(): string {
    return getQtmCurrentLocalDateTimePayload();
  }

  addMinutesToDateTimeLocalValue(value: string, minutes: number): string {
    return addMinutesToQtmDateTimeLocalValue(value, minutes);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
