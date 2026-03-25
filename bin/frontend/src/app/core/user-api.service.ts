import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}
