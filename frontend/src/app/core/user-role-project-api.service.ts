import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserRoleProjectDto {
  userId: number;
  tenantId: number;
  roleId: string;
  projectId: number;
}

@Injectable({ providedIn: 'root' })
export class UserRoleProjectApiService {
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/tenants$/, '');

  constructor(private readonly http: HttpClient) {}

  getRelationsByUserAndTenant(userId: number, tenantId: number): Observable<UserRoleProjectDto[]> {
    return this.http.get<UserRoleProjectDto[]>(`${this.baseUrl}/user-role-project/user/${userId}/tenant/${tenantId}`);
  }

  addRelation(dto: UserRoleProjectDto): Observable<UserRoleProjectDto> {
    return this.http.post<UserRoleProjectDto>(`${this.baseUrl}/user-role-project`, dto);
  }

  deleteRelation(userId: number, tenantId: number, roleId: string, projectId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/user-role-project/user/${userId}/tenant/${tenantId}/role/${encodeURIComponent(roleId)}/project/${encodeURIComponent(projectId)}`);
  }
}