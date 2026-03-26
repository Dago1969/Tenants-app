import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserTenantProjectRelationDto {
  userId: number;
  tenantId: number;
  projectId?: number;
  superuser: boolean;
  tenantCode?: string;
  tenantName?: string;
  username?: string;
  email?: string;
  projectCode?: string;
  projectDescription?: string;
}

@Injectable({ providedIn: 'root' })
export class UserTenantProjectApiService {
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/tenants$/, '');

  constructor(private readonly http: HttpClient) {}

  getRelationsByUserAndTenant(userId: number, tenantId: number): Observable<UserTenantProjectRelationDto[]> {
    return this.http.get<UserTenantProjectRelationDto[]>(
      `${this.baseUrl}/user-tenant-project/user/${encodeURIComponent(userId)}/tenant/${encodeURIComponent(tenantId)}`
    );
  }

  addRelation(dto: UserTenantProjectRelationDto): Observable<UserTenantProjectRelationDto> {
    return this.http.post<UserTenantProjectRelationDto>(`${this.baseUrl}/user-tenant-project`, dto);
  }

  deleteRelation(userId: number, tenantId: number, projectId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/user-tenant-project/${encodeURIComponent(userId)}/${encodeURIComponent(tenantId)}/${encodeURIComponent(projectId)}`
    );
  }
}
