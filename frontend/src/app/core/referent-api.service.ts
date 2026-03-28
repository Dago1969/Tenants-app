import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  constructor(private http: HttpClient) {}

  getAll(): Observable<ReferentDto[]> {
    return this.http.get<ReferentDto[]>('/api/tenants/referents');
  }
}
