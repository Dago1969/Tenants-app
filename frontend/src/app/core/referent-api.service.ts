
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReferentDto {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class ReferentApiService {
    /**
     * Crea un nuovo referente
     */
    create(dto: Partial<ReferentDto>) {
      return this.http.post<ReferentDto>(`${environment.apiBaseUrl}/referents`, dto);
    }
  constructor(private http: HttpClient) {}

  getAll(): Observable<ReferentDto[]> {
    return this.http.get<ReferentDto[]>(`${environment.apiBaseUrl}/referents`);
  }
}
