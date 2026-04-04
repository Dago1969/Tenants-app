import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { StructureBulkImportApiService, StructureBulkImportResultDto } from '../../core/structure-bulk-import-api.service';
import { MessageKey, t } from '../../i18n/messages';

const SUPPORTED_EXTENSIONS = ['csv', 'xls', 'xlsx'];

/**
 * Pagina dedicata all'import massivo delle strutture tramite upload di file CSV/XLS.
 */
@Component({
  selector: 'app-structure-bulk-import',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./structure-bulk-import.component.css'],
  template: `
    <section class="bulk-import-page">
      <div class="bulk-import-hero">
        <div>
          <p class="bulk-import-kicker">{{ translate('menu.bulkImport') }}</p>
          <h2>{{ translate('structureBulkImport.title') }}</h2>
          <p class="bulk-import-subtitle">{{ translate('structureBulkImport.subtitle') }}</p>
        </div>
        <div class="bulk-import-badge">
          {{ selectedFileName || translate('structureBulkImport.noFileSelected') }}
        </div>
      </div>

      <div class="bulk-import-grid">
        <article class="bulk-import-card bulk-import-card-primary">
          <h3>{{ translate('structureBulkImport.uploadTitle') }}</h3>
          <p class="bulk-import-copy">{{ translate('structureBulkImport.help') }}</p>

          <label class="bulk-import-upload-zone" [class.bulk-import-upload-zone-active]="!!selectedFile">
            <input type="file" accept=".csv,.xls,.xlsx" (change)="onFileSelected($event)" />
            <div class="bulk-import-upload-copy">
              <strong>{{ translate('structureBulkImport.fileLabel') }}</strong>
              <span>{{ translate('structureBulkImport.fileHint') }}</span>
            </div>
          </label>

          <div class="bulk-import-actions">
            <button class="btn btn-primary" type="button" (click)="upload()" [disabled]="isUploading || !selectedFile">
              {{ isUploading ? translate('structureBulkImport.actions.uploading') : translate('structureBulkImport.actions.upload') }}
            </button>
            <button class="btn btn-outline" type="button" (click)="clear()" [disabled]="isUploading">
              {{ translate('structureBulkImport.actions.clear') }}
            </button>
          </div>

          <div class="bulk-import-samples">
            <p class="bulk-import-samples-title">{{ translate('structureBulkImport.sample.title') }}</p>
            <div class="bulk-import-samples-actions">
              <button class="btn btn-outline" type="button" (click)="downloadSampleCsv()" [disabled]="isUploading">
                {{ translate('structureBulkImport.sample.downloadCsv') }}
              </button>
              <button class="btn btn-outline" type="button" (click)="downloadSampleXls()" [disabled]="isUploading">
                {{ translate('structureBulkImport.sample.downloadXls') }}
              </button>
            </div>
            <p class="bulk-import-samples-hint">{{ translate('structureBulkImport.sample.hint') }}</p>
          </div>

          <p *ngIf="errorMessage" class="bulk-import-message bulk-import-message-error">{{ errorMessage }}</p>
          <p *ngIf="successMessage" class="bulk-import-message bulk-import-message-success">{{ successMessage }}</p>
        </article>

        <article class="bulk-import-card bulk-import-card-secondary">
          <h3>{{ translate('structureBulkImport.guidelinesTitle') }}</h3>
          <ul class="bulk-import-guidelines">
            <li>{{ translate('structureBulkImport.guidelineFormat') }}</li>
            <li>{{ translate('structureBulkImport.guidelineRows') }}</li>
            <li>{{ translate('structureBulkImport.guidelineHeaders') }}</li>
            <li>{{ translate('structureBulkImport.guidelineParent') }}</li>
          </ul>

          <div *ngIf="result" class="bulk-import-result">
            <h4>{{ translate('structureBulkImport.result.title') }}</h4>
            <dl class="bulk-import-summary">
              <div>
                <dt>{{ translate('structureBulkImport.result.totalRows') }}</dt>
                <dd>{{ result.totalRows }}</dd>
              </div>
              <div>
                <dt>{{ translate('structureBulkImport.result.importedCount') }}</dt>
                <dd>{{ result.importedCount }}</dd>
              </div>
            </dl>

            <h4 style="margin-top: 18px;">{{ translate('structureBulkImport.result.importedCodes') }}</h4>
            <div *ngIf="result.importedCodes?.length; else noImportedCodes" class="bulk-import-chip-list">
              <span *ngFor="let code of result.importedCodes" class="bulk-import-chip">{{ code }}</span>
            </div>
            <ng-template #noImportedCodes>
              <p class="bulk-import-copy" style="margin-top: 10px;">{{ translate('structureBulkImport.result.completed') }}</p>
            </ng-template>
          </div>
        </article>
      </div>
    </section>
  `
})
export class StructureBulkImportComponent {
  selectedFile: File | null = null;
  selectedFileName = '';
  isUploading = false;
  result: StructureBulkImportResultDto | null = null;
  successMessage = '';
  errorMessage = '';

  constructor(private readonly structureBulkImportApiService: StructureBulkImportApiService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.result = null;
    this.successMessage = '';
    this.errorMessage = '';

    if (!file) {
      this.selectedFile = null;
      this.selectedFileName = '';
      return;
    }

    if (!this.isSupportedFile(file)) {
      this.selectedFile = null;
      this.selectedFileName = '';
      this.errorMessage = this.translate('structureBulkImport.error.invalidFormat');
      input.value = '';
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
  }

  upload(): void {
    if (!this.selectedFile) {
      this.errorMessage = this.translate('structureBulkImport.error.noFile');
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.structureBulkImportApiService.upload(this.selectedFile).subscribe({
      next: (response) => {
        this.result = response;
        this.successMessage = response.message || this.translate('structureBulkImport.result.completed');
        this.isUploading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isUploading = false;
        this.result = null;
        this.errorMessage = this.extractErrorMessage(error) || this.translate('structureBulkImport.error.upload');
      }
    });
  }

  clear(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.result = null;
    this.successMessage = '';
    this.errorMessage = '';
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  downloadSampleCsv(): void {
    this.downloadSampleFile('csv', 'text/csv;charset=utf-8', this.buildSampleCsvContent());
  }

  downloadSampleXls(): void {
    this.downloadSampleFile('xls', 'application/vnd.ms-excel;charset=utf-8', this.buildSampleXlsContent());
  }

  private isSupportedFile(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    return SUPPORTED_EXTENSIONS.includes(extension);
  }

  private downloadSampleFile(extension: 'csv' | 'xls', mimeType: string, content: string): void {
    const blob = new Blob([content], { type: mimeType });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `structure-import-sample.${extension}`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  }

  private buildSampleCsvContent(): string {
    return [
      'code,name,address,structureType,parentCode,description,cap,city,province,region,phone,email,serviceCalendarHours,active',
      'STR-001,Struttura Demo Via Roma,Via Roma 1,ASL,,Struttura di esempio per import massivo,00100,Roma,RM,Lazio,0612345678,demo@example.com,Lun-Ven 08:00-18:00,true'
    ].join('\n');
  }

  private buildSampleXlsContent(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
</head>
<body>
  <table>
    <tr>
      <th>code</th>
      <th>name</th>
      <th>address</th>
      <th>structureType</th>
      <th>parentCode</th>
      <th>description</th>
      <th>cap</th>
      <th>city</th>
      <th>province</th>
      <th>region</th>
      <th>phone</th>
      <th>email</th>
      <th>serviceCalendarHours</th>
      <th>active</th>
    </tr>
    <tr>
      <td>STR-001</td>
      <td>Struttura Demo Via Roma</td>
      <td>Via Roma 1</td>
      <td>ASL</td>
      <td></td>
      <td>Struttura di esempio per import massivo</td>
      <td>00100</td>
      <td>Roma</td>
      <td>RM</td>
      <td>Lazio</td>
      <td>0612345678</td>
      <td>demo@example.com</td>
      <td>Lun-Ven 08:00-18:00</td>
      <td>true</td>
    </tr>
  </table>
</body>
</html>`;
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const payload = error.error;
    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      const candidate = (payload as { detail?: string; message?: string; error?: string }).detail
        ?? (payload as { detail?: string; message?: string; error?: string }).message
        ?? (payload as { detail?: string; message?: string; error?: string }).error;
      if (candidate && candidate.trim()) {
        return candidate;
      }
    }

    return error.message;
  }
}