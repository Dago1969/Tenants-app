import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
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

type SearchResult = Record<string, unknown> & { id?: string | number };

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
          <button class="btn btn-primary" (click)="showFilters = !showFilters">
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

      <div *ngIf="showFilters" class="search-filters-panel">
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
                <option *ngFor="let option of getFieldOptions(field)" [ngValue]="option.value">{{ option.label }}</option>
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
            <button type="submit" class="btn btn-primary">{{ translate('crud.actions.search') }}</button>
            <button type="button" class="btn btn-outline" (click)="resetFilters()">{{ translate('crud.actions.reset') }}</button>
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
              <th *ngFor="let column of resultColumns">{{ translate(column.labelKey) }}</th>
              <th *ngIf="hasRowActions">{{ translate('search.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of filteredResults()">
              <td>{{ getRowIdentifier(row) }}</td>
              <td *ngFor="let column of resultColumns">
                <ng-container *ngIf="column.key === 'status'; else normalCell">
                  <span class="status-badge" [ngClass]="'status-' + (row[column.key] || 'unknown')">
                    {{ translate('status.' + (row[column.key] || 'unknown')) }}
                  </span>
                </ng-container>
                <ng-template #normalCell>{{ getDisplayValue(column, row[column.key]) }}</ng-template>
              </td>
              <td *ngIf="hasRowActions" class="actions">
                <button *ngIf="showEditAction && canEdit" class="icon-btn" type="button" (click)="openEdit(getRowIdentifier(row))" [title]="translate('search.action.edit')">
                  <span class="icon">✏️</span>
                </button>
                <button *ngIf="showViewAction" class="icon-btn" type="button" (click)="openView(getRowIdentifier(row))" [title]="translate('search.action.view')">
                  <span class="icon">👁️</span>
                </button>
                <button *ngIf="showDeleteAction && canDelete" class="icon-btn" type="button" (click)="deleteRecord(getRowIdentifier(row))" [title]="translate('search.action.delete')">
                  <span class="icon">🗑️</span>
                </button>
                <button *ngIf="showManageAction" class="icon-btn" type="button" (click)="openManage(getRowIdentifier(row))" [title]="translate('search.action.configure')">
                  <span class="icon">⚙️</span>
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
export class SearchPageComponent implements OnInit {
  showFilters = true;
  showTableSearch = false;
  tableSearchText = '';
  @Input({ required: true }) titleKey!: MessageKey;
  @Input({ required: true }) endpoint!: string;
  @Input({ required: true }) filters!: SearchField[];
  @Input({ required: true }) resultColumns!: SearchField[];
  @Input() createRoute = '';
  @Input() detailRouteBase = '';
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
  @Input() showViewAction = true;
  @Input() showDeleteAction = true;
  @Input() showManageAction = false;
  @Input() deleteCheckEndpoint = '';

  filterModel: Record<string, string> = {};
  results: SearchResult[] = [];
  selectedRole = '';
  selectedClient = '';
  fieldOptions: Record<string, SelectOption[]> = {};
  autocompleteOptions: Record<string, SelectOption[]> = {};
  canCreate = true;
  canEdit = true;
  canDelete = true;
  deleteDialogOpen = false;
  deleteDialogMode: DeleteDialogMode = 'confirm';
  deleteDialogRecordId = '';
  deleteDialogLinkedUsers: DeleteCheckLinkedUser[] = [];
  deleteDialogReplacementRoles: SelectOption[] = [];
  deleteDialogReplacementRoleId = '';
  operationLogs: OperationLogEntry[] = [];

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
    if (this.autoSearch) {
      this.search(false);
    }
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

  getFieldOptions(field: SearchField): SelectOption[] {
    return this.fieldOptions[field.key] ?? [];
  }

  getAutocompleteOptions(field: SearchField): SelectOption[] {
    return this.autocompleteOptions[field.key] ?? [];
  }

  getAutocompleteListId(field: SearchField): string {
    return `search-autocomplete-${field.key}`;
  }

  getDisplayValue(field: SearchField, value: unknown): string {
    if (value === undefined || value === null) {
      return '';
    }

    const normalizedValue = String(value);
    return field.displayValueMap?.[normalizedValue] ?? normalizedValue;
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

    this.http.get<SearchResult[]>(`${environment.apiBaseUrl}/${this.endpoint}`, { params }).subscribe({
      next: (data) => {
        this.results = data;
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

  openView(id: unknown): void {
    this.openCrudPage(id, 'view');
  }

  openEdit(id: unknown): void {
    console.log('[SearchPageComponent] openEdit called with id:', id);
    if ((id === 'new' && !this.canCreate) || (id !== 'new' && !this.canEdit)) {
      console.log('[SearchPageComponent] openEdit: permission denied for id', id);
      return;
    }

    this.openCrudPage(id, 'edit');
  }

  openManage(id: unknown): void {
    const normalizedId = this.normalizeId(id);
    if (normalizedId === null) {
      return;
    }
    void this.router.navigate([`/users/configure/${normalizedId}`]);
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

  private openCrudPage(id: unknown, mode: 'view' | 'edit'): void {

    console.log('[SearchPageComponent] openCrudPage called with id:', id, 'mode:', mode, 'createRoute:', this.createRoute, 'detailRouteBase:', this.detailRouteBase);
    if (mode === 'edit' && id === 'new' && this.createRoute) {
      // Se la createRoute è una route assoluta (wizard), naviga direttamente
      if (this.createRoute.startsWith('/')) {
        console.log('[SearchPageComponent] openCrudPage: navigating by URL to', this.createRoute);
        void this.router.navigateByUrl(this.createRoute);
        return;
      }
      // Altrimenti mantieni la logica esistente
      console.log('[SearchPageComponent] openCrudPage: navigating to', this.createRoute);
      void this.router.navigate([this.createRoute]);
      return;
    }


    const normalizedId = this.normalizeId(id);
    if (normalizedId === null) {
      console.log('[SearchPageComponent] openCrudPage: invalid id', id);
      return;
    }


    if (this.detailRouteBase) {
      const detailUrl = `${this.detailRouteBase}/${normalizedId}`;
      console.log('[SearchPageComponent] openCrudPage: navigating to detail', detailUrl, 'mode:', mode);
      void this.router.navigateByUrl(mode === 'view' ? `${detailUrl}?mode=view` : detailUrl);
      return;
    }

    console.log('[SearchPageComponent] openCrudPage: navigating to base endpoint', `/${this.getBaseEndpoint()}`, 'id:', normalizedId, 'mode:', mode);
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

  private buildExternalDetailUrl(normalizedId: string): string {
    const normalizedRouteBase = this.detailRouteBase.trim().replace(/^\/+|\/+$/g, '');
    const routeBase = normalizedRouteBase.length > 0 ? normalizedRouteBase : 'users';
    return `${window.location.origin}/${routeBase}/${normalizedId}`;
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
    this.operationLogs = [
      {
        id: Date.now() + this.operationLogs.length,
        type,
        message: this.resolveMessage(message)
      },
      ...this.operationLogs
    ].slice(0, 5);
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

  private async loadActionPermissions(): Promise<void> {
    if (!this.moduleCode) {
      this.canCreate = true;
      this.canEdit = true;
      this.canDelete = true;
      return;
    }

    this.canCreate = await this.resolveActionPermission(this.createFunctionCode);
    this.canEdit = await this.resolveActionPermission(this.editFunctionCode);
    this.canDelete = await this.resolveActionPermission(this.deleteFunctionCode);
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
