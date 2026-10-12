import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FarmacoDto {
  aicCode: string;
  tradeName: string;
  activeIngredient: string;
  dosage: string;
}

/**
 * API frontend per cercare i farmaci nel catalogo condiviso esposto da TENAPP.
 */
@Injectable({ providedIn: 'root' })
export class DrugService {
  private readonly searchUrl = `${environment.apiBaseUrl}/v1/drugs/search`;

  constructor(private readonly http: HttpClient) {}

  searchDrugs(term: string): Observable<FarmacoDto[]> {
    const params = new HttpParams().set('query', term.trim());
    return this.http.get<FarmacoDto[]>(this.searchUrl, { params });
  }
}