import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * DTO per i ticket.
 */
export interface TicketDto {
  id?: number;
  realm: string;
  project: string;
  patientId?: string | null;
  therapeuticPlanId?: string | null;
  ticketType: string;
  status: string;
  title: string;
  description: string;
  contentJson?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Dati minimi del piano terapeutico usati dal wizard ticket.
 */
export interface TicketTherapeuticPlanDto {
  id: number;
  patientId?: number | null;
  patientDisplayName?: string | null;
  projectCode?: string | null;
}

/**
 * Service per la gestione delle API dei ticket.
 */
@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiBase = `${environment.apiBaseUrl}/tickets`;
  private therapeuticPlanApiBase = `${environment.apiBaseUrl}/therapeutic-plans`;

  constructor(private http: HttpClient) {}

  /**
   * Crea un nuovo ticket.
   */
  createTicket(dto: TicketDto): Observable<TicketDto> {
    return this.http.post<TicketDto>(this.apiBase, dto);
  }

  /**
   * Recupera un ticket per ID.
   * Disponibile solo per SUPERADMIN e OperatoreQTM.
   */
  getTicketById(id: number): Observable<TicketDto> {
    return this.http.get<TicketDto>(`${this.apiBase}/${id}`);
  }

  /**
   * Aggiorna un ticket.
   * Disponibile solo per SUPERADMIN e OperatoreQTM.
   */
  updateTicket(id: number, dto: TicketDto): Observable<TicketDto> {
    return this.http.put<TicketDto>(`${this.apiBase}/${id}`, dto);
  }

  /**
   * Elimina un ticket.
   * Disponibile solo per SUPERADMIN e OperatoreQTM.
   */
  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }

  /**
   * Cambia lo status di un ticket (usa PATCH verso Tenants-app).
   */
  changeStatus(id: number, newStatus: string): Observable<TicketDto> {
    // inviamo un body vuoto, il backend si aspetta il path param
    return this.http.patch<TicketDto>(`${this.apiBase}/${id}/status/${encodeURIComponent(newStatus)}`, {});
  }

  /**
   * Recupera i piani terapeutici del progetto corrente per il tenant selezionato.
   */
  getTherapeuticPlansByProject(projectCode: string): Observable<TicketTherapeuticPlanDto[]> {
    return this.http.get<TicketTherapeuticPlanDto[]>(
      `${this.therapeuticPlanApiBase}?projectCode=${encodeURIComponent(projectCode)}`
    );
  }
}
