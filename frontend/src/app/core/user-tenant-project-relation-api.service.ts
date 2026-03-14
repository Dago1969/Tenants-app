import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserTenantProjectRelationDto {
  id: number;
  userId: number;
  tenantId: number;
  projectId: number;
  projectCode: string;
  superuser: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserTenantProjectRelationApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Restituisce tutte le relazioni utente-progetto per uno user e un tenant.
   */
  getRelationsByUserAndTenant(userId: number, tenant: string): Observable<UserTenantProjectRelationDto[]> {
    return this.http.get<UserTenantProjectRelationDto[]>(`${this.baseUrl}/user-tenant-project-relations?userId=${userId}&tenant=${encodeURIComponent(tenant)}`);
  }
}
