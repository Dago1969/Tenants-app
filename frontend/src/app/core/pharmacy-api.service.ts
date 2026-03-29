import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PharmacyDto {
  id: number;
  code: string;
  name: string;
  address: string;
  city: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class PharmacyApiService {
  constructor(private http: HttpClient) {}

  /**
   * Restituisce tutte le farmacie ospedaliere attive
   */
  getActiveHospitalPharmacies(): Observable<PharmacyDto[]> {
    return this.http.get<PharmacyDto[]>(`${environment.apiBaseUrl}/structures?structureType=HOSPITAL_PHARMACY&active=true`);
  }
}
