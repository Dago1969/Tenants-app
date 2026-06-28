import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { FunctionAuthorizationService } from '../core/function-authorization.service';
import { environment } from '../../environments/environment';
import { hasMessageKey, MessageKey, t } from '../i18n/messages';

export interface SearchField {
  key: string;
  labelKey: MessageKey;
  type: 'text' | 'number' | 'boolean' | 'select' | 'autocomplete';
  optionsEndpoint?: string;
  options?: Array<{ value: string; label: string }>;
  displayValueMap?: Record<string, string>;
  optionValueKey?: string;
  optionLabelKey?: string;
  optionsQueryParamKey?: string;
}

export interface SearchPrintSection {
  titleKey: MessageKey;
  descriptionKey?: MessageKey;
  fields: string[];
}

export type SearchResult = Record<string, unknown> & { id?: string | number };
export type SearchViewValueFormatter = (fieldKey: string, row: SearchResult) => string | null | undefined;

interface SelectOption {
  value: string;
  label: string;
}

interface DeleteCheckLinkedUser {
  id: string | number;
  username: string;
}

interface DeleteCheckReplacementRole {
  id: string;
  name?: string;
  description?: string;
}

interface DeleteCheckResponse {
  linkedUsers: DeleteCheckLinkedUser[];
  replacementRoles?: DeleteCheckReplacementRole[];
}

interface OperationLogEntry {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface ViewDetailItem {
  key: string;
  label: string;
  value: string;
  isStatus: boolean;
  statusClass?: string;
}

interface ViewDetailSection {
  title: string;
  description: string;
  items: ViewDetailItem[];
}

interface PagedSearchResponse {
  content?: SearchResult[];
}



type DeleteDialogMode = 'confirm' | 'reassign';
 
/**
 * Pagina riusabile di ricerca con filtri base e visualizzazione risultati.
 */
@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./search-page.component.css'],
  template: `
    <div class="search-main modern-search">
      <div class="search-header">
        <h2>{{ translate(titleKey) }}</h2>
        <div class="search-header-actions">
          <button *ngIf="showSearchAction && canSearch" class="btn btn-primary" (click)="showFilters = !showFilters">
            <span class="icon">☰</span> {{ translate('search.filters') }}
          </button>
          <ng-content select="[search-header-action]"></ng-content>
          <button *ngIf="showCreateAction && canCreate" class="btn btn-primary" type="button" (click)="openEdit('new')">
            <span class="icon">＋</span> {{ translate('crud.actions.new') }}
          </button>
        </div>
      </div>

      <div *ngIf="operationLogs.length > 0" class="search-log-panel">
        <div
          *ngFor="let log of operationLogs"
          class="search-log-entry"
          [class.search-log-entry-success]="log.type === 'success'"
          [class.search-log-entry-error]="log.type === 'error'"
        >
          {{ log.message }}
        </div>
      </div>

      <div *ngIf="showFilters && showSearchAction && canSearch" class="search-filters-panel">
        <form (ngSubmit)="search()" class="search-filters-form search-filters-form-inline">
          <ng-container *ngFor="let field of filters">
            <label class="search-filter-label search-filter-label-inline">
              <span>{{ translate(field.labelKey) }}</span>
              <input
                *ngIf="field.type !== 'boolean' && field.type !== 'select' && field.type !== 'autocomplete'"
                [type]="field.type"
                [(ngModel)]="filterModel[field.key]"
                [name]="field.key"
              />
              <select
                *ngIf="field.type === 'boolean'"
                [(ngModel)]="filterModel[field.key]"
                [name]="field.key"
              >
                <option value="">{{ translate('search.option.all') }}</option>
                <option value="true">{{ translate('search.boolean.true') }}</option>
                <option value="false">{{ translate('search.boolean.false') }}</option>
              </select>
              <select
                *ngIf="field.type === 'select'"
                [(ngModel)]="filterModel[field.key]"
                [name]="field.key"
              >
                <option value=""></option>
                <option *ngFor="let option of getFieldOptions(field)" [ngValue]="option.value">{{ translate(option.label) }}</option>
              </select>
              <input
                *ngIf="field.type === 'autocomplete'"
                type="text"
                [attr.list]="getAutocompleteListId(field)"
                [(ngModel)]="filterModel[field.key]"
                [name]="field.key"
                (input)="onAutocompleteInput(field, autocompleteValue.value)"
                #autocompleteValue
              />
              <datalist *ngIf="field.type === 'autocomplete'" [id]="getAutocompleteListId(field)">
                <option *ngFor="let option of getAutocompleteOptions(field)" [value]="option.value">{{ option.label }}</option>
              </datalist>
            </label>
          </ng-container>
          <div class="search-filters-actions search-filters-actions-inline">
            <ng-container *ngIf="showSearchAction && canSearch">
              <button type="submit" class="btn btn-primary">{{ translate('crud.actions.search') }}</button>
              <button type="button" class="btn btn-outline" (click)="resetFilters()">{{ translate('crud.actions.reset') }}</button>
            </ng-container>
          </div>
        </form>
      </div>

      <div class="search-table-container modern-table">
        <div class="table-search-bar-inside">
          <ng-container *ngIf="showTableSearch; else showLens">
            <div class="table-search-input-wrapper">
              <span class="search-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9" cy="9" r="7" stroke="#7a869a" stroke-width="2"/>
                  <line x1="14.4142" y1="14" x2="18" y2="17.5858" stroke="#7a869a" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </span>
              <input
                type="text"
                [(ngModel)]="tableSearchText"
                (input)="onTableSearch()"
                [placeholder]="translate('table.search.placeholder')"
                class="table-search-input"
              />
              <button class="close-btn" (click)="closeTableSearch()" title="{{ translate('table.search.close') }}">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="4" y1="4" x2="12" y2="12" stroke="#7a869a" stroke-width="2" stroke-linecap="round"/>
                  <line x1="12" y1="4" x2="4" y2="12" stroke="#7a869a" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </ng-container>
          <ng-template #showLens>
            <button class="table-search-btn" (click)="openTableSearch()" title="{{ translate('table.search.open') }}">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="9" r="7" stroke="#7a869a" stroke-width="2"/>
                <line x1="14.4142" y1="14" x2="18" y2="17.5858" stroke="#7a869a" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </ng-template>
        </div>
        <table class="search-table">
          <thead>
            <tr>
              <th>{{ translate(resultIdLabelKey) }}</th>
              <th *ngFor="let column of orderedResultColumns()">{{ translate(column.labelKey) }}</th>
              <th *ngIf="hasRowActions">{{ translate('search.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of filteredResults()">
              <td>{{ getRowIdentifier(row) }}</td>
              <td *ngFor="let column of orderedResultColumns()">
                <ng-container *ngIf="isStatusLikeColumn(column.key); else normalCell">
                  <span class="status-badge" [ngClass]="getStatusBadgeClass(column.key, row[column.key])">
                    {{ translate(getStatusLabelKey(column.key, row[column.key])) }}
                  </span>
                </ng-container>
                <ng-template #normalCell>{{ getDisplayValue(column, row[column.key], row) }}</ng-template>
              </td>
              <td *ngIf="hasRowActions" class="actions">
                <button *ngIf="showEditAction && canEdit" class="icon-btn" type="button" (click)="openEdit(getRowIdentifier(row))" [title]="translate('search.action.edit')">
                  <span class="icon">✏️</span>
                </button>
                <button *ngIf="showViewAction" class="icon-btn" type="button" (click)="openView(row)" [title]="translate('search.action.view')">
                  <span class="icon">👁️</span>
                </button>
                <button *ngIf="showDeleteAction && canDelete" class="icon-btn" type="button" (click)="deleteRecord(getRowIdentifier(row))" [title]="translate('search.action.delete')">
                  <span class="icon">🗑️</span>
                </button>
                <button
                  *ngIf="showManageAction"
                  class="icon-btn manage-btn"
                  type="button"
                  (click)="openManage(getRowIdentifier(row))"
                  [title]="translate(manageActionLabelKey || 'search.action.configure')"
                  [attr.aria-label]="translate(manageActionLabelKey || 'search.action.configure')"
                >
                  <span class="icon">⚙️</span>
                </button>
                <button *ngIf="showCloseAction" class="icon-btn" type="button" (click)="closeRow(getRowIdentifier(row))" [title]="translate('ticket.action.close')">
                  <span class="icon">🔒</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="search-pagination" *ngIf="results.length > 0">
          <span>{{ translate('pagination.page') }} 1 {{ translate('pagination.of') }} 1</span>
          <button class="icon-btn" disabled><span class="icon">◀</span></button>
          <button class="icon-btn" disabled><span class="icon">▶</span></button>
        </div>
      </div>

      <div *ngIf="viewDialogOpen" class="search-dialog-backdrop" (click)="closeViewDialog()">
        <div class="search-dialog search-view-dialog" role="dialog" aria-modal="true" aria-labelledby="search-view-dialog-title" (click)="$event.stopPropagation()">
          <div class="search-view-dialog-header">
            <div class="search-view-dialog-header-top">
              <div>
                <h3 id="search-view-dialog-title" class="search-dialog-title">{{ translate('search.view.title') }}</h3>
                <p class="search-view-dialog-subtitle">{{ viewDialogSubtitle }}</p>
              </div>
              <button class="search-view-dialog-close" type="button" (click)="closeViewDialog()" [attr.aria-label]="translate('crud.actions.cancel')">
                <span class="search-view-dialog-close-circle" aria-hidden="true">
                  <span class="search-view-dialog-close-icon"></span>
                </span>
              </button>
            </div>
          </div>

          <div class="search-view-dialog-body">
            <div *ngIf="hasConfiguredViewSections; else defaultViewLayout" class="search-view-sections">
              <section *ngFor="let section of viewDetailSections" class="search-view-section">
                <div class="search-view-section-header">
                  <h4 class="detail-section-title">{{ section.title }}</h4>
                  <p *ngIf="section.description" class="detail-section-description">{{ section.description }}</p>
                </div>
                <div class="summary4-grid search-view-summary-grid">
                  <div *ngFor="let row of getViewDetailRows(section.items)" class="summary4-row search-view-summary-row">
                    <div *ngFor="let item of row" class="summary4-col search-view-summary-col">
                      <div class="detail-field-label">{{ item.label }}</div>
                      <div class="detail-field-value search-view-value-block">
                        <span *ngIf="item.isStatus; else standardSectionValue" class="status-badge" [ngClass]="item.statusClass">
                          {{ item.value }}
                        </span>
                        <ng-template #standardSectionValue>
                          <span class="detail-field-value">{{ item.value }}</span>
                        </ng-template>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <ng-template #defaultViewLayout>
              <div *ngIf="viewDetailItems.length > 0; else emptyViewState" class="summary4-grid search-view-summary-grid">
              <div *ngFor="let row of viewDetailRows" class="summary4-row search-view-summary-row">
                <div *ngFor="let item of row" class="summary4-col search-view-summary-col">
                  <div class="detail-field-label">{{ item.label }}</div>
                  <div class="detail-field-value search-view-value-block">
                    <span *ngIf="item.isStatus; else standardViewValue" class="status-badge" [ngClass]="item.statusClass">
                      {{ item.value }}
                    </span>
                    <ng-template #standardViewValue>
                      <span class="detail-field-value">{{ item.value }}</span>
                    </ng-template>
                  </div>
                </div>
              </div>
              </div>
            </ng-template>

            <ng-template #emptyViewState>
              <p class="search-dialog-message search-view-empty-message">{{ translate('search.view.empty') }}</p>
            </ng-template>
          </div>

          <div class="search-dialog-actions">
            <button type="button" class="search-dialog-btn search-dialog-btn-primary" (click)="printViewDialog()">
              {{ translate('search.action.print') }}
            </button>
            <button type="button" class="search-dialog-btn search-dialog-btn-secondary" (click)="closeViewDialog()">
              {{ translate('crud.actions.cancel') }}
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="deleteDialogOpen" class="search-dialog-backdrop" (click)="closeDeleteDialog()">
        <div class="search-dialog" role="dialog" aria-modal="true" aria-labelledby="search-delete-dialog-title" (click)="$event.stopPropagation()">
          <h3 id="search-delete-dialog-title" class="search-dialog-title">{{ dialogTitle }}</h3>
          <p class="search-dialog-message">
            {{ translate(deleteDialogMode === 'reassign' ? 'search.confirm.reassignRequired' : 'search.confirm.delete') }}
          </p>

          <div *ngIf="deleteDialogMode === 'reassign'" class="search-dialog-section">
            <p class="search-dialog-section-title">{{ translate('search.confirm.linkedUsers') }}</p>
            <ul class="search-dialog-list">
              <li *ngFor="let user of deleteDialogLinkedUsers">{{ user.username }} (#{{ user.id }})</li>
            </ul>
          </div>

          <div *ngIf="deleteDialogMode === 'reassign'" class="search-dialog-section">
            <label class="search-dialog-label" for="replacement-role-select">{{ translate('search.confirm.selectReplacementRole') }}</label>
            <select
              id="replacement-role-select"
              class="search-dialog-select"
              [(ngModel)]="deleteDialogReplacementRoleId"
              [ngModelOptions]="{ standalone: true }"
            >
              <option *ngFor="let role of deleteDialogReplacementRoles" [ngValue]="role.value">{{ role.label }}</option>
            </select>
            <p *ngIf="deleteDialogReplacementRoles.length === 0" class="search-dialog-empty">{{ translate('search.confirm.noReplacementRoles') }}</p>
          </div>

          <div class="search-dialog-actions">
            <button
              type="button"
              class="search-dialog-btn search-dialog-btn-primary"
              (click)="confirmDeleteDialog()"
              [disabled]="!canConfirmDeleteDialog"
            >
              {{ translate('common.ok') }}
            </button>
            <button type="button" class="search-dialog-btn search-dialog-btn-secondary" (click)="closeDeleteDialog()">
              {{ translate('crud.actions.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SearchPageComponent implements OnInit, OnChanges {
  showFilters = true;
  showTableSearch = false;
  tableSearchText = '';
  @Input({ required: true }) titleKey!: MessageKey;
  @Input({ required: true }) endpoint!: string;
  @Input({ required: true }) filters!: SearchField[];
  @Input({ required: true }) resultColumns!: SearchField[];
  @Input() createRoute = '';
  @Input() detailRouteBase = '';
  @Input() fieldPermissionsEndpoint = '';
  @Input() moduleCode = '';
  @Input() createFunctionCode = 'CREATE';
  @Input() editFunctionCode = 'UPDATE';
  @Input() deleteFunctionCode = 'DELETE';
  @Input() fixedParams: Record<string, string | number | boolean> = {};
  @Input() resultIdKey = 'id';
  @Input() resultIdLabelKey: MessageKey = 'common.id';
  @Input() autoSearch = false;
  @Input() showCreateAction = true;
  @Input() showEditAction = true;
  @Input() showSearchAction = true;
  @Input() searchFunctionCode = 'SEARCH';
  @Input() showViewAction = true;
  @Input() showDeleteAction = true;
  @Input() showManageAction = false;
  @Input() showCloseAction = false;
  @Input() manageRouteBase = '/users/configure';
  @Input() manageActionLabelKey = '';
  @Input() deleteCheckEndpoint = '';
  @Input() interceptEditAction = false;
  @Input() printSections: SearchPrintSection[] = [];
  @Input() viewLabelKeys: Record<string, MessageKey | string> = {};
  @Input() viewValueFormatter?: SearchViewValueFormatter;
  @Output() editAction = new EventEmitter<string>();
  @Output() closeAction = new EventEmitter<string>();

  filterModel: Record<string, string> = {};
  results: SearchResult[] = [];
  selectedRole = '';
  selectedClient = '';
  fieldOptions: Record<string, SelectOption[]> = {};
  autocompleteOptions: Record<string, SelectOption[]> = {};
  fieldPermissions: Record<string, string> = {};
  canCreate = true;
  canEdit = true;
  canSearch = true;
  canDelete = true;
  viewDialogOpen = false;
  deleteDialogOpen = false;
  deleteDialogMode: DeleteDialogMode = 'confirm';
  deleteDialogRecordId = '';
  deleteDialogLinkedUsers: DeleteCheckLinkedUser[] = [];
  deleteDialogReplacementRoles: SelectOption[] = [];
  deleteDialogReplacementRoleId = '';
  operationLogs: OperationLogEntry[] = [];
  selectedViewRow: SearchResult | null = null;
  private operationLogTimeouts: { [key: string]: any } = {};

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
    this.loadFieldPermissions();
    // If moduleCode not provided, try to infer it from the endpoint
    if (!this.moduleCode && this.endpoint) {
      this.moduleCode = this.inferModuleCodeFromEndpoint(this.endpoint);
    }

    void this.loadActionPermissions();
    if (this.autoSearch) {
      this.search(false);
    }
  }

  private inferModuleCodeFromEndpoint(endpoint: string): string {
    // Take last segment after slash
    const parts = endpoint.split('/').filter((p) => p.trim().length > 0);
    if (parts.length === 0) {
      return '';
    }

    let candidate = parts[parts.length - 1];

    // Remove common suffixes
    if (candidate.endsWith('ies')) {
      // e.g. 'countries' -> 'country'
      candidate = candidate.slice(0, -3) + 'y';
    } else if (candidate.endsWith('s')) {
      candidate = candidate.slice(0, -1);
    }

    // Replace non-alphanumeric with underscore and uppercase
    return candidate.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']) {
      this.loadSelectOptions();
    }
  }

  get visibleResultColumns(): SearchField[] {
    return this.resultColumns.filter((column) => !this.isFieldHidden(column.key));
  }

  orderedResultColumns(): SearchField[] {
    const regularColumns = this.visibleResultColumns.filter((column) => !this.isStatusLikeColumn(column.key));
    const statusColumns = this.visibleResultColumns.filter((column) => this.isStatusLikeColumn(column.key));
    return [...regularColumns, ...statusColumns];
  }

  // (definizioni già presenti, duplicati rimossi)

  // (duplicato rimosso)

  // Permette anche string dinamiche per le chiavi di traduzione
  translate(key: string): string {
    try {
      // Se la chiave esiste come MessageKey, usa t, altrimenti fallback
      return t(key as MessageKey) || key;
    } catch {
      return key;
    }
  }

  get viewDialogSubtitle(): string {
    if (!this.selectedViewRow) {
      return '';
    }

    const identifier = this.getRowIdentifier(this.selectedViewRow);
    if (identifier === null) {
      return this.translate(this.titleKey);
    }

    return `${this.translate(this.resultIdLabelKey)}: ${identifier}`;
  }

  get viewDetailItems(): ViewDetailItem[] {
    if (!this.selectedViewRow) {
      return [];
    }

    const preferredKeys = [
      this.resultIdKey,
      ...this.orderedResultColumns().map((column) => column.key),
      ...Object.keys(this.selectedViewRow).filter((key) => !this.isFieldHidden(key))
    ];
    const uniqueKeys = preferredKeys.filter((key, index) => preferredKeys.indexOf(key) === index);

    return uniqueKeys
      .map((key) => this.buildViewDetailItem(key, this.selectedViewRow?.[key]))
      .filter((item): item is ViewDetailItem => item !== null);
  }

  get viewDetailRows(): ViewDetailItem[][] {
    return this.getViewDetailRows(this.viewDetailItems);
  }

  get hasConfiguredViewSections(): boolean {
    return this.viewDetailSections.length > 0;
  }

  get viewDetailSections(): ViewDetailSection[] {
    if (!this.hasConfiguredPrintSections()) {
      return [];
    }

    return this.printSections
      .map((section) => {
        const items = section.fields
          .map((fieldKey) => this.buildViewDetailItem(fieldKey, this.selectedViewRow?.[fieldKey]))
          .filter((item): item is ViewDetailItem => item !== null);

        if (items.length === 0) {
          return null;
        }

        return {
          title: this.translate(section.titleKey),
          description: section.descriptionKey ? this.translate(section.descriptionKey) : '',
          items
        };
      })
      .filter((section): section is ViewDetailSection => section !== null);
  }

  getViewDetailRows(items: ViewDetailItem[]): ViewDetailItem[][] {
    const rows: ViewDetailItem[][] = [];

    for (let index = 0; index < items.length; index += 4) {
      rows.push(items.slice(index, index + 4));
    }

    return rows;
  }

  getFieldOptions(field: SearchField): SelectOption[] {
    return this.fieldOptions[field.key] ?? [];
  }

  getAutocompleteOptions(field: SearchField): SelectOption[] {
    return this.autocompleteOptions[field.key] ?? [];
  }

  getAutocompleteListId(field: SearchField): string {
    return `search-autocomplete-${field.key}`;
  }

  getDisplayValue(field: SearchField, value: unknown, row?: SearchResult): string {
    if (value === undefined || value === null) {
      return '';
    }

    const normalizedValue = String(value);

    // If patient column, prefer to show surname + name if available in the row
    if (field.key === 'patientId' && row) {
      const lastName = (row['patientLastName'] as string) ?? (row['patientSurname'] as string) ?? (row['patientFamilyName'] as string) ?? (row['lastName'] as string) ?? (row['surname'] as string) ?? (row['cognome'] as string) ?? '';
      const firstName = (row['patientFirstName'] as string) ?? (row['patientGivenName'] as string) ?? (row['firstName'] as string) ?? (row['givenName'] as string) ?? (row['nome'] as string) ?? '';
      const displayName = (row['patientDisplayName'] as string) ?? (row['patientFullName'] as string) ?? (row['patient_name'] as string) ?? '';
      const combined = [lastName.trim(), firstName.trim()].filter((s) => s).join(' ');
      if (combined) {
        return combined;
      }
      if (displayName) {
        return displayName;
      }

      // If no name data available, return raw ID value (do NOT format it as a date)
      return normalizedValue;
    }

    // If the field is date-like or the value matches an ISO datetime, format it
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/;
    if (field.key === 'updatedAt' || /date|time|at/i.test(field.key) || isoDateRegex.test(normalizedValue)) {
      const formatted = this.formatIsoDate(normalizedValue);
      if (formatted) {
        return formatted;
      }
    }

    return field.displayValueMap?.[normalizedValue] ?? normalizedValue;
  }

  private formatIsoDate(value: string): string | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    // Try to parse the date
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = parsed.getFullYear();
    const hh = String(parsed.getHours()).padStart(2, '0');
    const min = String(parsed.getMinutes()).padStart(2, '0');

    // Italian format dd/MM/yyyy HH.mm (note the dot between hours and minutes)
    return `${dd}/${mm}/${yyyy} ${hh}.${min}`;
  }

  isStatusLikeColumn(columnKey: string): boolean {
    return columnKey === 'status' || columnKey === 'active';
  }

  getStatusBadgeClass(columnKey: string, value: unknown): string {
    return `status-${this.getNormalizedStatusValue(columnKey, value)}`;
  }

  getStatusLabelKey(columnKey: string, value: unknown): string {
    return `status.${this.getNormalizedStatusValue(columnKey, value)}`;
  }

  private getNormalizedStatusValue(columnKey: string, value: unknown): string {
    if (columnKey === 'active') {
      return value === true || value === 'true' ? 'attivo' : 'inattivo';
    }

    if (value === undefined || value === null || value === '') {
      return 'unknown';
    }

    return String(value);
  }

  getRowIdentifier(row: SearchResult): string | number | null {
    const identifier = row[this.resultIdKey];
    return typeof identifier === 'string' || typeof identifier === 'number' ? identifier : null;
  }

  get dialogTitle(): string {
    const clientName = this.selectedClient.trim();
    return clientName.length > 0 ? clientName : this.translate('app.title');
  }

  get canConfirmDeleteDialog(): boolean {
    return this.deleteDialogMode === 'confirm' || this.deleteDialogReplacementRoleId.trim().length > 0;
  }

  get hasRowActions(): boolean {
    return this.showEditAction || this.showViewAction || this.showDeleteAction || this.showManageAction;
  }

  search(showFeedback = true): void {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(this.fixedParams)) {
      params = params.set(key, String(value));
    }

    for (const filter of this.filters) {
      const value = this.filterModel[filter.key];
      if (value === undefined || value === null || value === '') {
        continue;
      }

      params = params.set(filter.key, value);
    }

    this.http.get<SearchResult[] | PagedSearchResponse>(`${environment.apiBaseUrl}/${this.endpoint}`, { params }).subscribe({
      next: (data) => {
        this.results = this.normalizeSearchResults(data);
        if (showFeedback) {
          this.pushOperationLog('success', 'search.success.search');
        }
      },
      error: (error) => {
        this.results = [];
        if (showFeedback) {
          this.pushOperationLog('error', this.buildErrorMessage('search.error.search', error));
        }
      }
    });
  }

  private normalizeSearchResults(data: SearchResult[] | PagedSearchResponse): SearchResult[] {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.content)) {
      return data.content;
    }

    return [];
  }

  resetFilters(): void {
    this.filterModel = {};
    this.results = [];
    this.autocompleteOptions = {};
  }

  onAutocompleteInput(field: SearchField, rawValue: string): void {
    const value = rawValue.trim();
    if (!field.optionsEndpoint) {
      return;
    }

    if (value.length === 0) {
      this.autocompleteOptions[field.key] = [];
      return;
    }

    let params = new HttpParams().set(field.optionsQueryParamKey ?? field.key, value);
    params = params.set('enabled', 'true');

    this.http.get<Record<string, unknown>[]>(`${environment.apiBaseUrl}/${field.optionsEndpoint}`, { params }).subscribe({
      next: (items) => {
        this.autocompleteOptions[field.key] = (items ?? [])
          .map((item) => this.mapToSelectOption(field, item))
          .filter((option): option is SelectOption => option !== null)
          .slice(0, 20);
      },
      error: () => {
        this.autocompleteOptions[field.key] = [];
      }
    });
  }

  openView(row: SearchResult): void {
    this.selectedViewRow = row;
    this.viewDialogOpen = true;
  }

  openEdit(id: unknown): void {
    if ((id === 'new' && !this.canCreate) || (id !== 'new' && !this.canEdit)) {
      return;
    }

    if (this.interceptEditAction && id !== 'new') {
      const normalizedId = this.normalizeId(id);
      if (normalizedId !== null) {
        this.editAction.emit(normalizedId);
      }
      return;
    }

    this.openCrudPage(id, 'edit');
  }

  closeViewDialog(): void {
    this.viewDialogOpen = false;
    this.selectedViewRow = null;
  }

  printViewDialog(): void {
    if (!this.selectedViewRow) {
      return;
    }

    const popupWindow = window.open('', '_blank', 'width=960,height=720');
    if (!popupWindow) {
      return;
    }

    popupWindow.document.open();
    popupWindow.document.write(this.buildPrintMarkup());
    popupWindow.document.close();
    popupWindow.focus();
    popupWindow.print();
  }

  openManage(id: unknown): void {
    const normalizedId = this.normalizeId(id);
    if (normalizedId === null) {
      return;
    }

    const normalizedRouteBase = this.manageRouteBase.trim();
    if (!normalizedRouteBase) {
      return;
    }

    void this.router.navigateByUrl(`${normalizedRouteBase}/${normalizedId}`);
  }

  deleteRecord(id: unknown): void {
    if (!this.canDelete) {
      return;
    }

    const normalizedId = this.normalizeId(id);
    if (normalizedId === null) {
      return;
    }

    if (this.deleteCheckEndpoint) {
      this.handleDeleteWithPrecheck(normalizedId);
      return;
    }

    this.openDeleteConfirmationDialog(normalizedId);
  }

  closeRow(id: unknown): void {
    const normalizedId = this.normalizeId(id);
    if (normalizedId === null) {
      return;
    }

    this.closeAction.emit(normalizedId);
  }

  private openCrudPage(id: unknown, mode: 'view' | 'edit'): void {
    if (mode === 'edit' && id === 'new' && this.createRoute) {
      // Se la createRoute è una route assoluta (wizard), naviga direttamente
      if (this.createRoute.startsWith('/')) {
        void this.router.navigateByUrl(this.createRoute);
        return;
      }
      // Altrimenti mantieni la logica esistente
      void this.router.navigate([this.createRoute]);
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

  private handleDeleteWithPrecheck(normalizedId: string): void {
    this.http.get<DeleteCheckResponse>(`${environment.apiBaseUrl}/${this.deleteCheckEndpoint}/${normalizedId}`).subscribe({
      next: (deleteCheck) => {
        const linkedUsers = deleteCheck.linkedUsers ?? [];
        if (linkedUsers.length === 0) {
          this.openDeleteConfirmationDialog(normalizedId);
          return;
        }

        const replacementRoles = deleteCheck.replacementRoles ?? [];
        this.openDeleteReassignmentDialog(normalizedId, linkedUsers, replacementRoles);
      },
      error: (error) => {
        this.pushOperationLog('error', this.buildErrorMessage('search.error.deleteCheck', error));
      }
    });
  }

  private buildViewDetailItem(key: string, value: unknown): ViewDetailItem | null {
    const trimmedKey = key?.trim();
    if (!trimmedKey || this.isFieldHidden(trimmedKey)) {
      return null;
    }

    const row = this.selectedViewRow;
    const customValue = row ? this.viewValueFormatter?.(trimmedKey, row) : undefined;
    if (customValue === null || customValue === undefined) {
      if (row && value === undefined && !(trimmedKey in row)) {
        return null;
      }
    }

    const isStatus = this.isStatusLikeColumn(trimmedKey);
    return {
      key: trimmedKey,
      label: this.resolveFieldLabel(trimmedKey),
      value: customValue ?? this.formatViewValue(trimmedKey, value),
      isStatus,
      statusClass: isStatus ? this.getStatusBadgeClass(trimmedKey, value) : undefined
    };
  }

  private resolveFieldLabel(key: string): string {
    const customLabel = this.viewLabelKeys[key];
    if (customLabel) {
      return hasMessageKey(customLabel) ? this.translate(customLabel) : String(customLabel);
    }

    if (key === this.resultIdKey) {
      return this.translate(this.resultIdLabelKey);
    }

    const knownField = [...this.resultColumns, ...this.filters].find((field) => field.key === key);
    if (knownField) {
      return this.translate(knownField.labelKey);
    }

    return key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[._-]+/g, ' ')
      .replace(/^./, (initial) => initial.toUpperCase());
  }

  private formatViewValue(key: string, value: unknown): string {
    if (this.isStatusLikeColumn(key)) {
      return this.translate(this.getStatusLabelKey(key, value));
    }

    if (typeof value === 'boolean') {
      return value ? this.translate('search.boolean.true') : this.translate('search.boolean.false');
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.formatViewValue(key, item)).join(', ');
    }

    // If the field has an object value, stringify it
    if (value && typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    const normalized = value === undefined || value === null ? '' : String(value);

    // Try to decode using a configured displayValueMap from known fields
    const knownField = [...this.resultColumns, ...this.filters].find((f) => f.key === key);
    if (knownField && knownField.displayValueMap) {
      const mapped = knownField.displayValueMap[normalized];
      if (mapped !== undefined) {
        return mapped;
      }
    }

    // Special handling for patient display in view dialog: prefer lastName + firstName or patientDisplayName
    if (key === 'patientId' && this.selectedViewRow) {
      const lastName = (this.selectedViewRow['patientLastName'] as string) ?? (this.selectedViewRow['patientSurname'] as string) ?? (this.selectedViewRow['patientFamilyName'] as string) ?? (this.selectedViewRow['lastName'] as string) ?? (this.selectedViewRow['surname'] as string) ?? (this.selectedViewRow['cognome'] as string) ?? '';
      const firstName = (this.selectedViewRow['patientFirstName'] as string) ?? (this.selectedViewRow['patientGivenName'] as string) ?? (this.selectedViewRow['firstName'] as string) ?? (this.selectedViewRow['givenName'] as string) ?? (this.selectedViewRow['nome'] as string) ?? '';
      const displayName = (this.selectedViewRow['patientDisplayName'] as string) ?? (this.selectedViewRow['patientFullName'] as string) ?? (this.selectedViewRow['patient_name'] as string) ?? '';
      const combined = [lastName.trim(), firstName.trim()].filter((s) => s).join(' ');
      if (combined) {
        return combined;
      }
      if (displayName) {
        return displayName;
      }

      // If no name data available, return raw value (do not format as date)
      return value === undefined || value === null ? '' : String(value);
    }

    // Date formatting for view values
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/;
    if (key === 'updatedAt' || /date|time|at/i.test(key) || isoDateRegex.test(normalized)) {
      const formatted = this.formatIsoDate(normalized);
      if (formatted) {
        return formatted;
      }
    }

    return normalized;
  }

  private buildPrintMarkup(): string {
    const title = this.escapeHtml(this.translate('search.view.title'));
    const subtitle = this.escapeHtml(this.viewDialogSubtitle);
    const content = this.hasConfiguredPrintSections()
      ? this.buildSectionedPrintMarkup()
      : this.viewDetailItems.map((item) => `
      <div class="print-row">
        <div class="print-label">${this.escapeHtml(item.label)}</div>
        <div class="print-value">${this.escapeHtml(item.value).replace(/\n/g, '<br>')}</div>
      </div>
    `).join('');

    return `<!DOCTYPE html>
      <html lang="it">
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #1f2937; }
            h1 { margin: 0 0 8px; font-size: 24px; color: #1f3d6e; }
            .subtitle { margin: 0 0 24px; color: #4b5563; }
            .print-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
            .print-sections { display: grid; gap: 24px; }
            .print-section { border: 1px solid #dbe4f0; border-radius: 16px; padding: 18px 20px; background: #f8fbff; }
            .print-section-header { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #dbe4f0; }
            .print-section-title { margin: 0 0 6px; font-size: 18px; color: #1f3d6e; }
            .print-section-description { margin: 0; color: #4b5563; font-size: 13px; line-height: 1.5; }
            .print-row { border: 1px solid #dbe4f0; border-radius: 10px; padding: 12px 14px; break-inside: avoid; }
            .print-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #4667a8; margin-bottom: 8px; }
            .print-value { font-size: 14px; white-space: pre-wrap; word-break: break-word; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="subtitle">${subtitle}</p>
          <div class="${this.hasConfiguredPrintSections() ? 'print-sections' : 'print-grid'}">${content}</div>
        </body>
      </html>`;
  }

  private hasConfiguredPrintSections(): boolean {
    return this.printSections.length > 0 && this.selectedViewRow !== null;
  }

  private buildSectionedPrintMarkup(): string {
    return this.printSections
      .map((section) => {
        const sectionItems = section.fields
          .map((fieldKey) => this.buildViewDetailItem(fieldKey, this.selectedViewRow?.[fieldKey]))
          .filter((item): item is ViewDetailItem => item !== null);

        if (sectionItems.length === 0) {
          return '';
        }

        const sectionRows = sectionItems.map((item) => `
          <div class="print-row">
            <div class="print-label">${this.escapeHtml(item.label)}</div>
            <div class="print-value">${this.escapeHtml(item.value).replace(/\n/g, '<br>')}</div>
          </div>
        `).join('');

        const descriptionMarkup = section.descriptionKey
          ? `<p class="print-section-description">${this.escapeHtml(this.translate(section.descriptionKey))}</p>`
          : '';

        return `
          <section class="print-section">
            <div class="print-section-header">
              <h2 class="print-section-title">${this.escapeHtml(this.translate(section.titleKey))}</h2>
              ${descriptionMarkup}
            </div>
            <div class="print-grid">${sectionRows}</div>
          </section>
        `;
      })
      .filter((sectionMarkup) => sectionMarkup.length > 0)
      .join('');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private openDeleteConfirmationDialog(normalizedId: string): void {
    this.deleteDialogMode = 'confirm';
    this.deleteDialogRecordId = normalizedId;
    this.deleteDialogLinkedUsers = [];
    this.deleteDialogReplacementRoles = [];
    this.deleteDialogReplacementRoleId = '';
    this.deleteDialogOpen = true;
  }

  // (duplicati rimossi)

  filteredResults(): SearchResult[] {
    if (!this.showTableSearch || !this.tableSearchText.trim()) {
      return this.results;
    }
    const text = this.tableSearchText.trim().toLowerCase();
    return this.results.filter(row =>
      Object.values(row).some(val =>
        val && String(val).toLowerCase().includes(text)
      )
    );
  }

  openTableSearch() {
    this.showTableSearch = true;
    setTimeout(() => {
      const el = document.querySelector('.table-search-input') as HTMLInputElement;
      if (el) el.focus();
    }, 0);
  }

  closeTableSearch() {
    this.showTableSearch = false;
    this.tableSearchText = '';
  }

  onTableSearch() {
    // trigger change detection
  }

  private openDeleteReassignmentDialog(
    normalizedId: string,
    linkedUsers: DeleteCheckLinkedUser[],
    replacementRoles: DeleteCheckReplacementRole[]
  ): void {
    const replacementOptions = replacementRoles.map((role) => ({
      value: role.id,
      label: role.name || role.description ? `${role.id} - ${role.name ?? role.description}` : role.id
    }));

    this.deleteDialogMode = 'reassign';
    this.deleteDialogRecordId = normalizedId;
    this.deleteDialogLinkedUsers = linkedUsers;
    this.deleteDialogReplacementRoles = replacementOptions;
    this.deleteDialogReplacementRoleId = replacementOptions[0]?.value ?? '';
    this.deleteDialogOpen = true;
  }

  closeDeleteDialog(): void {
    this.deleteDialogOpen = false;
    this.deleteDialogMode = 'confirm';
    this.deleteDialogRecordId = '';
    this.deleteDialogLinkedUsers = [];
    this.deleteDialogReplacementRoles = [];
    this.deleteDialogReplacementRoleId = '';
  }

  confirmDeleteDialog(): void {
    const normalizedId = this.deleteDialogRecordId;
    const replacementRoleId = this.deleteDialogMode === 'reassign'
      ? this.deleteDialogReplacementRoleId.trim()
      : undefined;

    if (!normalizedId || (this.deleteDialogMode === 'reassign' && !replacementRoleId)) {
      return;
    }

    this.closeDeleteDialog();
    this.executeDelete(normalizedId, replacementRoleId);
  }

  private executeDelete(normalizedId: string, replacementRoleId?: string): void {
    let params = new HttpParams();
    if (replacementRoleId) {
      params = params.set('replacementRoleId', replacementRoleId);
    }

    this.http.delete<void>(`${environment.apiBaseUrl}/${this.getBaseEndpoint()}/${normalizedId}`, { params }).subscribe({
      next: () => {
        this.pushOperationLog('success', 'search.success.delete');
        this.search(false);
      },
      error: (error) => {
        this.pushOperationLog('error', this.buildErrorMessage('search.error.delete', error));
      }
    });
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
        error: (error) => {
          this.fieldOptions[field.key] = [];
          this.pushOperationLog('error', this.buildErrorMessage('search.error.options', error));
        }
      });
    }
  }

  private pushOperationLog(type: 'success' | 'error', message: MessageKey | string): void {
    const entry: OperationLogEntry = {
      id: Date.now() + this.operationLogs.length,
      type,
      message: this.resolveMessage(message)
    };
    this.operationLogs = [entry, ...this.operationLogs].slice(0, 5);

    // Cancella eventuale timeout precedente per questo id
    if (this.operationLogTimeouts[entry.id]) {
      clearTimeout(this.operationLogTimeouts[entry.id]);
    }
    // Imposta timeout per rimozione automatica
    const timeoutMs = type === 'error' ? 20000 : 10000;
    this.operationLogTimeouts[entry.id] = setTimeout(() => {
      this.operationLogs = this.operationLogs.filter((log) => log.id !== entry.id);
      delete this.operationLogTimeouts[entry.id];
    }, timeoutMs);
  }

  private buildErrorMessage(messageKey: MessageKey, error: unknown): string {
    const baseMessage = this.translate(messageKey);
    const reason = this.extractErrorReason(error);
    if (!reason) {
      return baseMessage;
    }

    return `${baseMessage} ${this.translate('common.reason')}: ${reason}`;
  }

  private extractErrorReason(error: unknown): string | null {
    if (!(error instanceof HttpErrorResponse)) {
      return null;
    }

    const responseError = error.error;
    if (typeof responseError === 'string') {
      return this.normalizeErrorReason(responseError);
    }

    if (responseError && typeof responseError === 'object') {
      const candidate = this.findObjectErrorReason(responseError as Record<string, unknown>);
      return candidate ? this.normalizeErrorReason(candidate) : null;
    }

    return this.normalizeErrorReason(error.message);
  }

  private findObjectErrorReason(errorBody: Record<string, unknown>): string | null {
    const candidates = [errorBody['detail'], errorBody['message'], errorBody['error'], errorBody['title']];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate;
      }
    }

    return null;
  }

  private normalizeErrorReason(reason: string | null | undefined): string | null {
    if (!reason) {
      return null;
    }

    const normalized = reason
      .replace(/^\d+\s+[A-Z_-]+\s+/i, '')
      .replace(/^error:\s*/i, '')
      .replace(/^"|"$/g, '')
      .trim();

    return normalized.length > 0 ? normalized : null;
  }

  private resolveMessage(message: MessageKey | string): string {
    return hasMessageKey(message) ? this.translate(message) : message;
  }

  private loadFieldPermissions(): void {
    if (!this.fieldPermissionsEndpoint) {
      this.fieldPermissions = {};
      return;
    }

    this.http.get<Record<string, string>>(`${environment.apiBaseUrl}/${this.fieldPermissionsEndpoint}`).subscribe({
      next: (permissions) => {
        this.fieldPermissions = permissions ?? {};
      },
      error: () => {
        this.fieldPermissions = {};
      }
    });
  }

  private getFieldPermission(fieldKey: string): string {
    return this.fieldPermissions[fieldKey] ?? 'full-edit';
  }

  private isFieldHidden(fieldKey: string): boolean {
    return this.getFieldPermission(fieldKey) === 'hide-field';
  }

  private async loadActionPermissions(): Promise<void> {
    if (!this.moduleCode) {
      this.canCreate = true;
      this.canEdit = true;
      this.canDelete = true;
      this.canSearch = true;
      return;
    }

    this.canCreate = await this.resolveActionPermission(this.createFunctionCode);
    this.canEdit = await this.resolveActionPermission(this.editFunctionCode);
    this.canDelete = await this.resolveActionPermission(this.deleteFunctionCode);
    this.canSearch = await this.resolveActionPermission(this.searchFunctionCode);
  }

  private async resolveActionPermission(functionCode: string): Promise<boolean> {
    if (!functionCode) {
      return true;
    }

    try {
      return await this.functionAuthorizationService.canUseFunction(this.moduleCode, functionCode);
    } catch {
      return false;
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
