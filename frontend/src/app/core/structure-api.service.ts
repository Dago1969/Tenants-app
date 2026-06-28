import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StructureDto {
  id?: number;
  code: string;
  name: string;
  selectionLabel?: string;
  description?: string;
  address: string;
  cap: string;
  cityId?: number | string;
  city?: string;
  provinceId: number | string;
  province?: string;
  regionId: number | string;
  region?: string;
  phone: string;
  email?: string;
  serviceCalendarHours?: string;
  active?: boolean;
  structureType?: string;
  structureTypeDescription?: string;
  functionDescription?: string;
  structureTypeDisplayOrder?: number;
  parentStructureId?: number;
  parentStructureName?: string;
  referents: any[];
  hospitalPharmacyIds?: (number | string)[];
  pharmacies?: Array<{ id?: number }>;
  departmentsSelected?: Array<{ departmentId: number; referentId?: number }>;
}

@Injectable({ providedIn: 'root' })
export class StructureApiService {
  private baseUrl = `${environment.apiBaseUrl}/structures`;

  constructor(private http: HttpClient) {}

  getStructuresByType(structureType: string, active?: boolean): Observable<StructureDto[]> {
    let params = new HttpParams().set('structureType', structureType);

    if (typeof active === 'boolean') {
      params = params.set('active', String(active));
    }

    return this.http.get<StructureDto[]>(this.baseUrl, { params });
  }

  getParentOptions(structureType: string): Observable<Array<{ id: number; code: string; name: string; structureType: string; structureTypeDescription?: string }>> {
    const params = new HttpParams().set('structureType', structureType);
    return this.http.get<Array<{ id: number; code: string; name: string; structureType: string; structureTypeDescription?: string }>>(
      `${this.baseUrl}/parent-options`,
      { params }
    );
  }

  createStructure(structure: StructureDto): Observable<any> {
    return this.http.post<any>(this.baseUrl, structure);
  }

  getStructure(id: number | string): Observable<StructureDto> {
    return this.http.get<StructureDto>(`${this.baseUrl}/${id}`);
  }

  updateStructure(id: number | string, structure: StructureDto): Observable<StructureDto> {
    return this.http.put<StructureDto>(`${this.baseUrl}/${id}`, structure);
  }
}
