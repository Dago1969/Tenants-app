import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GeographicOptionDto {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class GeographyApiService {
  constructor(private http: HttpClient) {}

  /**
   * Restituisce tutte le regioni (usando sempre environment.apiBaseUrl)
   */
  getRegions(): Observable<GeographicOptionDto[]> {
    return this.http.get<GeographicOptionDto[]>(`${environment.apiBaseUrl}/geography/regions`);
  }

  /**
   * Restituisce tutte le province per una regione (usando sempre environment.apiBaseUrl)
   */
  getProvincesByRegion(regionId: number | string): Observable<GeographicOptionDto[]> {
    return this.http.get<GeographicOptionDto[]>(`${environment.apiBaseUrl}/geography/provinces/by-region/${regionId}`);
  }

  /**
   * Restituisce tutte le città per una provincia (usando sempre environment.apiBaseUrl)
   */
  getCitiesByProvince(provinceId: number | string): Observable<GeographicOptionDto[]> {
    return this.http.get<GeographicOptionDto[]>(`${environment.apiBaseUrl}/geography/cities/by-province/${provinceId}`);
  }
}
