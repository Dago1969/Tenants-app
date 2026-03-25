import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface TenantAppPointerDto {
  id: number;
  clientCode: string;
  clientName: string;
  tenantAppUrl: string;
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class TenantPointerApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getTenantPointerByClientCode(clientCode: string): Observable<TenantAppPointerDto | null> {
    const requestUrl = `${this.baseUrl}/tenant-app-pointers/by-client/${encodeURIComponent(clientCode)}`;
    // eslint-disable-next-line no-console
    console.log('[TenantPointerApiService] GET', requestUrl);

    return this.http.get<TenantAppPointerDto | null>(requestUrl).pipe(
      tap({
        next: (response) => {
          // eslint-disable-next-line no-console
          console.log('[TenantPointerApiService] Response for clientCode', clientCode, ':', response);
        },
        error: (error) => {
          // eslint-disable-next-line no-console
          console.error('[TenantPointerApiService] Error during tenant pointer lookup for clientCode', clientCode, error);
        }
      })
    );
  }
}
