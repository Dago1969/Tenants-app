import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DepartmentDto {
  id: number;
  areaFunzionale?: string;
  reparto?: string;
}

export interface PharmacyDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  serviceCalendarHours?: string;
  address: string;
  city: string;
  active: boolean;
  structureType?: string;
  structureTypeDescription?: string;
}

@Injectable({ providedIn: 'root' })
export class PharmacyApiService {
  constructor(private http: HttpClient) {}

  private getActivePharmaciesByType(structureType: string): Observable<PharmacyDto[]> {
    return this.http.get<PharmacyDto[]>(
      `${environment.apiBaseUrl}/structures?structureType=${structureType}&active=true`
    );
  }

  /**
   * Restituisce tutte le farmacie ospedaliere attive
   */
  getActiveHospitalPharmacies(): Observable<PharmacyDto[]> {
    return this.getActivePharmaciesByType('HOSPITAL_PHARMACY');
  }

  /**
   * Restituisce le farmacie selezionabili per le strutture ospedaliere.
   */
  getSelectablePharmacies(): Observable<PharmacyDto[]> {
    return forkJoin([
      this.getActivePharmaciesByType('HOSPITAL_PHARMACY'),
      this.getActivePharmaciesByType('RETAIL_PHARMACY')
    ]).pipe(
      map(([hospitalPharmacies, retailPharmacies]) => {
        return [...hospitalPharmacies, ...retailPharmacies]
          .sort((left, right) => {
            const leftType = left.structureTypeDescription ?? left.structureType ?? '';
            const rightType = right.structureTypeDescription ?? right.structureType ?? '';
            return `${leftType} ${left.name}`.localeCompare(`${rightType} ${right.name}`);
          });
      })
    );
  }

  /**
   * Restituisce i dipartimenti disponibili dal backend Tenants.
   */
  getDepartments(area?: string): Observable<DepartmentDto[]> {
    const params = area ? `?area=${encodeURIComponent(area)}` : '';
    return this.http.get<DepartmentDto[]>(`${environment.apiBaseUrl}/departments${params}`);
  }
}
