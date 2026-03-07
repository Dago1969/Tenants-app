import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { FunctionAuthorizationService } from '../core/function-authorization.service';
import { environment } from '../../environments/environment';
import { MessageKey, t } from '../i18n/messages';

export interface SearchField {
  key: string;
  labelKey: MessageKey;
  type: 'text' | 'number' | 'boolean' | 'select';
  optionsEndpoint?: string;
  options?: Array<{ value: string; label: string }>;
  displayValueMap?: Record<string, string>;
  optionValueKey?: string;
  optionLabelKey?: string;
}

type SearchResult = Record<string, unknown> & { id?: string | number };

interface SelectOption {
  value: string;
  label: string;
}

/**
 * Pagina riusabile di ricerca con filtri base e visualizzazione risultati.
 */
@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./search-page.component.css'],
  template: `
    <div class="search-main">
      <div class="search-table-container">
        <h2 style="margin-bottom: 18px;">{{ translate(titleKey) }}</h2>
        <form (ngSubmit)="search()" style="display:grid; grid-template-columns: repeat(3, minmax(180px, 1fr)); gap: 14px; margin-bottom: 18px;">
          <ng-container *ngFor="let field of filters">
            <label style="display:flex; flex-direction:column; gap:4px;">
              <span>{{ translate(field.labelKey) }}</span>
              <input
                *ngIf="field.type !== 'boolean' && field.type !== 'select'"
                [type]="field.type"
                [(ngModel)]="filterModel[field.key]"
                [name]="field.key"
                style="border:1px solid #bfc9d9; border-radius:4px; padding:6px 8px; background:#f8fafc;"
              />
              <select
                *ngIf="field.type === 'boolean'"
                [(ngModel)]="filterModel[field.key]"
                [name]="field.key"
                style="border:1px solid #bfc9d9; border-radius:4px; padding:6px 8px; background:#f8fafc;"
              >
                <option value="">-</option>
                <option value="true">{{ translate('search.boolean.true') }}</option>
                <option value="false">{{ translate('search.boolean.false') }}</option>
              </select>
              <select
                *ngIf="field.type === 'select'"
                [(ngModel)]="filterModel[field.key]"
                [name]="field.key"
                style="border:1px solid #bfc9d9; border-radius:4px; padding:6px 8px; background:#f8fafc;"
              >
                <option value=""></option>
                <option *ngFor="let option of getFieldOptions(field)" [ngValue]="option.value">{{ option.label }}</option>
              </select>
            </label>
          </ng-container>
          <div style="display:flex; gap:8px; align-items:end;">
            <button type="submit" style="background:#3866a3;color:#fff;padding:8px 18px;border-radius:8px;border:none;font-weight:500;">{{ translate('crud.actions.search') }}</button>
            <button type="button" (click)="resetFilters()" style="background:#e5e7eb;color:#222;padding:8px 18px;border-radius:8px;border:none;font-weight:500;">{{ translate('crud.actions.reset') }}</button>
          </div>
        </form>
        <h3 style="margin-bottom: 12px;">{{ translate('search.results') }}</h3>
        <table class="search-table">
          <thead>
            <tr>
              <th>{{ translate('common.id') }}</th>
              <th *ngFor="let column of resultColumns">{{ translate(column.labelKey) }}</th>
              <th>{{ translate('search.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of results">
              <td>{{ row.id }}</td>
              <td *ngFor="let column of resultColumns">{{ getDisplayValue(column, row[column.key]) }}</td>
              <td class="actions">
                <button class="icon-btn" type="button" (click)="openEdit(row.id)" [title]="translate('search.action.edit')">
                  <span style="font-size:1.2rem;">✏️</span>
                </button>
                <button class="icon-btn" type="button" (click)="openView(row.id)" [title]="translate('search.action.view')">
                  <span style="font-size:1.2rem;">👁️</span>
                </button>
                <button class="icon-btn" type="button" (click)="deleteRecord(row.id)" [title]="translate('search.action.delete')">
                  <span style="font-size:1.2rem;">🗑️</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button *ngIf="canCreate" class="search-new-btn" type="button" (click)="openEdit('new')">{{ translate('crud.actions.new') }}</button>
    </div>
  `
})
export class SearchPageComponent implements OnInit {
  @Input({ required: true }) titleKey!: MessageKey;
  @Input({ required: true }) endpoint!: string;
  @Input({ required: true }) filters!: SearchField[];
  @Input({ required: true }) resultColumns!: SearchField[];
  @Input() createRoute = '';
  @Input() detailRouteBase = '';
  @Input() moduleCode = '';
  @Input() createFunctionCode = '';

  filterModel: Record<string, string> = {};
  results: SearchResult[] = [];
  selectedRole = '';
  selectedClient = '';
  fieldOptions: Record<string, SelectOption[]> = {};
  canCreate = true;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly functionAuthorizationService: FunctionAuthorizationService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.selectedRole = this.authService.getSelectedRole();
    this.selectedClient = this.authService.getSelectedClient();
    this.loadSelectOptions();
    void this.loadActionPermissions();
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  getFieldOptions(field: SearchField): SelectOption[] {
    return this.fieldOptions[field.key] ?? [];
  }

  getDisplayValue(field: SearchField, value: unknown): string {
    if (value === undefined || value === null) {
      return '';
    }

    const normalizedValue = String(value);
    return field.displayValueMap?.[normalizedValue] ?? normalizedValue;
  }

  search(): void {
    let params = new HttpParams();

    for (const filter of this.filters) {
      const value = this.filterModel[filter.key];
      if (value === undefined || value === null || value === '') {
        continue;
      }

      params = params.set(filter.key, value);
    }

    this.http.get<SearchResult[]>(`${environment.apiBaseUrl}/${this.endpoint}`, { params }).subscribe({
      next: (data) => {
        this.results = data;
      },
      error: () => {
        this.results = [];
      }
    });
  }

  resetFilters(): void {
    this.filterModel = {};
    this.results = [];
  }

  openView(id: unknown): void {
    this.openCrudPage(id, 'view');
  }

  openEdit(id: unknown): void {
    if (id === 'new' && !this.canCreate) {
      return;
    }

    this.openCrudPage(id, 'edit');
  }

  deleteRecord(id: unknown): void {
    const normalizedId = this.normalizeId(id);
    if (normalizedId === null) {
      return;
    }

    this.http.delete<void>(`${environment.apiBaseUrl}/${this.getBaseEndpoint()}/${normalizedId}`).subscribe({
      next: () => this.search(),
      error: () => {
        this.results = [];
      }
    });
  }

  private openCrudPage(id: unknown, mode: 'view' | 'edit'): void {
    if (mode === 'edit' && id === 'new' && this.createRoute) {
      void this.router.navigateByUrl(this.createRoute);
      return;
    }

    const normalizedId = this.normalizeId(id);
    if (normalizedId === null) {
      return;
    }

    if (this.detailRouteBase) {
      const detailUrl = `${this.detailRouteBase}/${normalizedId}`;
      void this.router.navigateByUrl(mode === 'view' ? `${detailUrl}?mode=view` : detailUrl);
      return;
    }

    void this.router.navigate([`/${this.getBaseEndpoint()}`], {
      queryParams: {
        id: normalizedId,
        mode
      }
    });
  }

  private normalizeId(id: unknown): string | null {
    if (typeof id === 'number') {
      return String(id);
    }

    if (typeof id === 'string' && id.trim().length > 0) {
      return id;
    }

    return null;
  }

  private getBaseEndpoint(): string {
    return this.endpoint.replace(/\/search$/, '');
  }

  private loadSelectOptions(): void {
    for (const field of this.filters.filter((currentField) => currentField.type === 'select')) {
      if (field.options && field.options.length > 0) {
        this.fieldOptions[field.key] = field.options.map((option) => ({
          value: option.value,
          label: option.label
        }));
        continue;
      }

      if (!field.optionsEndpoint) {
        this.fieldOptions[field.key] = [];
        continue;
      }

      this.http.get<Record<string, unknown>[]>(`${environment.apiBaseUrl}/${field.optionsEndpoint}`).subscribe({
        next: (items) => {
          this.fieldOptions[field.key] = (items ?? [])
            .map((item) => this.mapToSelectOption(field, item))
            .filter((option): option is SelectOption => option !== null);
        },
        error: () => {
          this.fieldOptions[field.key] = [];
        }
      });
    }
  }

  private async loadActionPermissions(): Promise<void> {
    if (!this.moduleCode || !this.createFunctionCode) {
      this.canCreate = true;
      return;
    }

    try {
      this.canCreate = await this.functionAuthorizationService.canUseFunction(this.moduleCode, this.createFunctionCode);
    } catch {
      this.canCreate = false;
    }
  }

  private mapToSelectOption(field: SearchField, item: Record<string, unknown>): SelectOption | null {
    const valueKey = field.optionValueKey ?? 'id';
    const labelKey = field.optionLabelKey ?? 'name';
    const rawValue = item[valueKey];

    if (typeof rawValue !== 'string' && typeof rawValue !== 'number') {
      return null;
    }

    const rawLabel = item[labelKey];
    const value = String(rawValue);

    return {
      value,
      label: typeof rawLabel === 'string' && rawLabel.trim().length > 0 && rawLabel !== value
        ? `${value} - ${rawLabel}`
        : value
    };
  }
}
