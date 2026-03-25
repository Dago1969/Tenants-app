import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserTenantRoleRelationDto {
  userId: number;
  tenantId: number;
  roleId: string;
}

@Injectable({ providedIn: 'root' })
export class UserTenantRoleRelationApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getRelationsByUserAndTenant(userId: number, tenantId: number): Observable<UserTenantRoleRelationDto[]> {
    const url = this.baseUrl.replace(/\/tenants$/, '') + `/user-tenant-role/user/${userId}/tenant/${tenantId}`;
    return this.http.get<UserTenantRoleRelationDto[]>(url);
  }

  addRelation(dto: UserTenantRoleRelationDto): Observable<UserTenantRoleRelationDto> {
    const url = this.baseUrl.replace(/\/tenants$/, '') + '/user-tenant-role';
    return this.http.post<UserTenantRoleRelationDto>(url, dto);
  }

  deleteRelation(userId: number, tenantId: number, roleId: string): Observable<void> {
    const url = this.baseUrl.replace(/\/tenants$/, '') + `/user-tenant-role/user/${userId}/tenant/${tenantId}/role/${roleId}`;
    return this.http.delete<void>(url);
  }
}
