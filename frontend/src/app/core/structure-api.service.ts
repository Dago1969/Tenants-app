import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}

@Injectable({ providedIn: 'root' })
export class StructureApiService {
  private baseUrl = `${environment.apiBaseUrl}/structures`;

  constructor(private http: HttpClient) {}

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
