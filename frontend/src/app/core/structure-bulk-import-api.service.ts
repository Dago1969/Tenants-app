import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StructureBulkImportResultDto {
  totalRows: number;
  importedCount: number;
  importedCodes: string[];
  message: string;
}

/**
 * Client API per l'import massivo di strutture.
 */
@Injectable({ providedIn: 'root' })
export class StructureBulkImportApiService {
  private readonly endpoint = `${environment.apiBaseUrl}/structures/import`;

  constructor(private readonly http: HttpClient) {}

  upload(file: File): Observable<StructureBulkImportResultDto> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<StructureBulkImportResultDto>(this.endpoint, formData);
  }
}