import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProjectDto {
  id: number;
  code: string;
  descrizione: string;
  clientCode: string;
  tenantId: number;
  dataInizio?: string;
  dataFine?: string;
  enabled?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProjectApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Restituisce tutti i progetti attivi per il tenant corrente.
   */
  getProjectsByTenant(tenantId: number): Observable<ProjectDto[]> {
    return this.http.get<ProjectDto[]>(`${this.baseUrl}/tenants/projects?tenantId=${tenantId}`);
  }
}
