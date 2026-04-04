import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserDto {
  id: number;
  username: string;
  email: string;
  enabled: boolean;
  clientId: string;
  projectId: number;
  roleId: number;
  structureId: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  private readonly endpoint = `${environment.apiBaseUrl}/users`;

  constructor(private readonly http: HttpClient) {}

  getUserById(id: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.endpoint}/${id}`);
  }

  searchUsers(filters: {
    username?: string;
    email?: string;
    roleId?: string;
    structureId?: number;
    enabled?: boolean;
  }): Observable<UserDto[]> {
    let params = new HttpParams();

    if (filters.username) {
      params = params.set('username', filters.username);
    }
    if (filters.email) {
      params = params.set('email', filters.email);
    }
    if (filters.roleId) {
      params = params.set('roleId', filters.roleId);
    }
    if (filters.structureId !== undefined) {
      params = params.set('structureId', String(filters.structureId));
    }
    if (filters.enabled !== undefined) {
      params = params.set('enabled', String(filters.enabled));
    }

    return this.http.get<UserDto[]>(`${this.endpoint}/search`, { params });
  }
}
