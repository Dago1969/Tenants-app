import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserRoleProfileDto {
  userId: number;
  tenantId: number;
  roleId: string;
  profileId: string;
}

@Injectable({ providedIn: 'root' })
export class UserRoleProfileApiService {
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/tenants$/, '');

  constructor(private readonly http: HttpClient) {}

  getRelationsByUserAndTenant(userId: number, tenantId: number): Observable<UserRoleProfileDto[]> {
    return this.http.get<UserRoleProfileDto[]>(`${this.baseUrl}/user-role-profile/user/${userId}/tenant/${tenantId}`);
  }

  addRelation(dto: UserRoleProfileDto): Observable<UserRoleProfileDto> {
    return this.http.post<UserRoleProfileDto>(`${this.baseUrl}/user-role-profile`, dto);
  }

  deleteRelation(userId: number, tenantId: number, roleId: string, profileId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/user-role-profile/user/${userId}/tenant/${tenantId}/role/${encodeURIComponent(roleId)}/profile/${encodeURIComponent(profileId)}`);
  }
}