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
}

@Injectable({ providedIn: 'root' })
export class StructureApiService {
  private baseUrl = `${environment.apiBaseUrl}/structures`;

  constructor(private http: HttpClient) {}

  createStructure(structure: StructureDto): Observable<any> {
    return this.http.post<any>(this.baseUrl, structure);
  }
}
