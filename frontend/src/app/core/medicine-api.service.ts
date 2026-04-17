import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MedicineLookupDto {
  id?: number;
  codiceAic: string;
  codFarmaco?: string;
  denominazione?: string;
  descrizione?: string;
  forma?: string;
  codiceAtc?: string;
  ragioneSociale?: string;
}

/**
 * API frontend per interrogare il catalogo farmaci di QTMDB tramite il proxy TENAPP.
 */
@Injectable({ providedIn: 'root' })
export class MedicineApiService {
  private readonly medicinesUrl = `${environment.apiBaseUrl}/medicines`;

  constructor(private readonly http: HttpClient) {}

  lookupMedicines(query?: string): Observable<MedicineLookupDto[]> {
    const normalizedQuery = query?.trim();
    const url = normalizedQuery?.length
      ? `${this.medicinesUrl}/lookup?query=${encodeURIComponent(normalizedQuery)}`
      : `${this.medicinesUrl}/lookup`;
    return this.http.get<MedicineLookupDto[]>(url);
  }

  getMedicineByCodiceAic(codiceAic: string): Observable<MedicineLookupDto> {
    return this.http.get<MedicineLookupDto>(`${this.medicinesUrl}/codice-aic/${encodeURIComponent(codiceAic)}`);
  }
}