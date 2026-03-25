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
  /**
   * Rimuove una relazione user-tenant-project tramite proxy TENAPP (come la POST, passando da baseUrl).
   */
  removeRelation(userId: number, tenantId: number, projectId: number): Observable<void> {
    // L'endpoint corretto è baseUrl senza /tenants + /user-tenant-project/delete/{userId}/{tenantId}/{projectId}
    const url = this.baseUrl.replace(/\/tenants$/, '') + `/user-tenant-project/delete/${userId}/${tenantId}/${projectId}`;
    return this.http.delete<void>(url);
  }
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Restituisce tutte le relazioni utente-progetto per uno user e un tenant.
   */
  getRelationsByUserAndTenant(userId: number, tenant: string): Observable<UserTenantProjectRelationDto[]> {
    return this.http.get<UserTenantProjectRelationDto[]>(`${this.baseUrl}/user-tenant-project-relations?userId=${userId}&tenant=${encodeURIComponent(tenant)}`);
  }
  /**
   * Inserisce una nuova relazione user-tenant-project.
   */
  addRelation(dto: Omit<UserTenantProjectRelationDto, 'id' | 'projectCode'>): Observable<UserTenantProjectRelationDto> {
    // L'endpoint corretto è /api/user-tenant-project, quindi rimuovo "/tenants" se presente in baseUrl
    let url = this.baseUrl.replace(/\/tenants$/, '') + '/user-tenant-project';
    return this.http.post<UserTenantProjectRelationDto>(url, dto);
  }
}
