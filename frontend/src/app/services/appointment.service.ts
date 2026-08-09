import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface Appointment {
  id: number;
  therapeuticPlanId: number | null;
  appointmentTypeId: number | null;
  appointmentTypeName: string;
  nurseId: number | null;
  nurseName: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  notes: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);

  getByTherapeuticPlan(therapeuticPlanId: number): Observable<Appointment[]> {
    if (!therapeuticPlanId) {
      return of([]);
    }

    return this.http.get<Appointment[]>(`/api/tenants/appointments/by-therapeutic-plan/${therapeuticPlanId}`);
  }

  updateAppointment(appointmentId: number, payload: Appointment): Observable<Appointment> {
    if (!appointmentId) {
      return of(payload);
    }

    return this.http.put<Appointment>(`/api/tenants/appointments/${appointmentId}`, payload);
  }

  deleteAppointment(appointmentId: number): Observable<void> {
    if (!appointmentId) {
      return of(void 0);
    }

    return this.http.delete<void>(`/api/tenants/appointments/${appointmentId}`);
  }
}