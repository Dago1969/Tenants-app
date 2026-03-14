import { CommonModule, Location } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { FunctionAuthorizationService } from '../core/function-authorization.service';
import { hasMessageKey, MessageKey, t } from '../i18n/messages';

export interface CrudField {
  key: string;
  labelKey: MessageKey;
  type: 'text' | 'number' | 'checkbox' | 'date' | 'datetime-local' | 'select';
  hidden?: boolean;
  createOnly?: boolean;
  readonly?: boolean;
  lockOnEdit?: boolean;
  optionsEndpoint?: string;
  options?: Array<{ value: string; label: string }>;
  optionValueKey?: string;
  optionLabelKey?: string;
  resetFieldsOnChange?: string[];
  includeValueInOptionLabel?: boolean;
  relatedFields?: Record<string, string>;
  required?: boolean;
}

export interface CrudFolder {
  key: string;
  titleKey: MessageKey;
  fields: CrudField[];
}

type CrudEntity = Record<string, unknown> & { id?: string | number };

interface SelectOption {
  value: string | number;
  label: string;
  source: Record<string, unknown>;
}

interface OperationLogEntry {
  id: number;
  type: 'success' | 'error';
  message: string;
}

/**
 * Componente riusabile per pagine CRUD tenant senza lista oggetti.
 */
@Component({
  selector: 'app-crud-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./crud-page.component.css'],
  template: `
    <section class="crud-shell">
      <div class="crud-card">
        <header class="crud-header">
          <div>
            <h2>{{ translate(titleKey) }}</h2>
          </div>
        </header>

        <div *ngIf="operationLogs.length > 0" class="crud-log-panel">
          <div
            *ngFor="let log of operationLogs"
            class="crud-log-entry"
            [class.crud-log-entry-success]="log.type === 'success'"
            [class.crud-log-entry-error]="log.type === 'error'"
          >
            {{ log.message }}
          </div>
        </div>

        <div *ngIf="folders.length > 0" class="crud-folder-tabs">
          <button
            *ngFor="let folder of folders"
            type="button"
            (click)="activeFolder = folder.key"
            class="crud-folder-btn"
            [class.active]="activeFolder === folder.key"
          >
            {{ translate(folder.titleKey) }}
          </button>
        </div>

        <form class="crud-form" #crudForm="ngForm" (ngSubmit)="save(crudForm)" novalidate>
          <div class="crud-fields">
            <div class="crud-field-row" *ngFor="let field of currentFields">
              <label class="crud-label" [for]="field.key">
                {{ translate(field.labelKey) }}
                <span *ngIf="field.required === true" class="crud-required-marker">*</span>
              </label>

              <div *ngIf="field.type !== 'checkbox' && field.type !== 'select'" class="crud-field-control">
                <ng-container *ngIf="field.key === 'username'; else genericInput">
                  <input
                    class="crud-input"
                    [class.crud-input-invalid]="shouldShowRequiredError(field, usernameInput) || usernameTaken"
                    [id]="field.key"
                    [type]="field.type"
                    [(ngModel)]="formModel[field.key]"
                    [name]="field.key"
                    [disabled]="isFieldDisabled(field)"
                    (blur)="onFieldBlur(field)"
                    [required]="field.required === true"
                    #usernameInput="ngModel"
                  />
                  <div *ngIf="usernameTaken" class="crud-field-error">
                    {{ translate(usernameTakenMessageKey) }}
                  </div>
                  <div *ngIf="shouldShowRequiredError(field, usernameInput) && !usernameTaken" class="crud-field-error">
                    {{ translate(requiredFieldMessageKey) }}
                  </div>
                </ng-container>

                <ng-template #genericInput>
                  <input
                    class="crud-input"
                    [class.crud-input-invalid]="shouldShowRequiredError(field, genericField)"
                    [id]="field.key"
                    [type]="field.type"
                    [(ngModel)]="formModel[field.key]"
                    [name]="field.key"
                    [disabled]="isFieldDisabled(field)"
                    (blur)="onFieldBlur(field)"
                    [required]="field.required === true"
                    #genericField="ngModel"
                  />
                  <div *ngIf="shouldShowRequiredError(field, genericField)" class="crud-field-error">
                    {{ translate(requiredFieldMessageKey) }}
                  </div>
                </ng-template>
              </div>

              <div *ngIf="field.type === 'select'" class="crud-field-control">
                <select
                  class="crud-input"
                  [class.crud-input-invalid]="shouldShowRequiredError(field, selectField)"
                  [id]="field.key"
                  [ngModel]="formModel[field.key]"
                  (ngModelChange)="onSelectChange(field, $event)"
                  [name]="field.key"
                  [disabled]="isFieldDisabled(field)"
                  [required]="field.required === true"
                  #selectField="ngModel"
                >
                  <option value=""></option>
                  <option *ngFor="let option of getFieldOptions(field)" [ngValue]="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <div *ngIf="shouldShowRequiredError(field, selectField)" class="crud-field-error">
                  {{ translate(requiredFieldMessageKey) }}
                </div>
              </div>

              <label *ngIf="field.type === 'checkbox'" class="crud-checkbox-wrap" [for]="field.key">
                <input
                  class="crud-checkbox"
                  [id]="field.key"
                  type="checkbox"
                  [(ngModel)]="formModel[field.key]"
                  [name]="field.key"
                  [disabled]="isFieldDisabled(field)"
                />
              </label>
            </div>
          </div>

          <div class="crud-actions" *ngIf="!isViewMode">
            <button class="crud-btn crud-btn-secondary" type="button" (click)="cancel()">
              {{ translate('crud.actions.cancel') }}
            </button>
            <button class="crud-btn crud-btn-primary" type="submit">
              {{ loadedEntityKeyValue !== null ? translate('crud.actions.update') : translate('crud.actions.create') }}
            </button>
          </div>

          <div class="crud-actions" *ngIf="isViewMode">
            <button class="crud-btn crud-btn-secondary" type="button" (click)="cancel()">
              {{ translate('crud.actions.back') }}
            </button>
          </div>
        </form>
      </div>
    </section>
  `
})
export class CrudPageComponent implements OnInit, OnChanges {
  readonly requiredFieldMessageKey = 'crud.validation.required' as MessageKey;
  readonly usernameTakenMessageKey: MessageKey = 'users.error.username.taken';

  @Input({ required: true }) titleKey!: MessageKey;
  @Input({ required: true }) endpoint!: string;
  @Input() fields: CrudField[] = [];
  @Input() folders: CrudFolder[] = [];
  @Input() fieldPermissionsEndpoint = '';
  @Input() entityKey = 'id';
  @Input() moduleCode = '';
  @Input() createFunctionCode = 'CREATE';
  @Input() updateFunctionCode = 'UPDATE';
  @Input() initialFormModel: CrudEntity = {};

  formModel: CrudEntity = {};
  usernameTaken = false;
  submissionAttempted = false;
  activeFolder = '';
  isViewMode = false;
  fieldPermissions: Record<string, string> = {};
  fieldOptions: Record<string, SelectOption[]> = {};
  operationLogs: OperationLogEntry[] = [];
  private operationLogTimeouts: Record<number, any> = {};
  protected loadedEntityKeyValue: string | number | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    private readonly functionAuthorizationService: FunctionAuthorizationService,
    private readonly router: Router,
    private readonly location: Location
  ) {}

  ngOnInit(): void {
    // eslint-disable-next-line no-console
    console.log('[CrudPageComponent] ngOnInit for endpoint', this.endpoint, 'with initial model:', this.initialFormModel);
    this.applyInitialFormModel('ngOnInit');
    void this.initializePage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialFormModel']) {
      this.applyInitialFormModel('ngOnChanges');
    }
  }

  get currentFields(): CrudField[] {
    if (this.folders.length === 0) {
      return this.fields.filter((field) => this.shouldDisplayField(field));
    }

    const active = this.folders.find((folder) => folder.key === this.activeFolder);
    return (active?.fields ?? []).filter((field) => this.shouldDisplayField(field));
  }

  isFieldDisabled(field: CrudField): boolean {
    return this.isViewMode
      || field.readonly === true
      || (field.lockOnEdit === true && this.loadedEntityKeyValue !== null)
      || this.hasUnresolvedSelectDependencies(field)
      || this.getFieldPermission(field.key) === 'read-only';
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  getFieldOptions(field: CrudField): SelectOption[] {
    return this.fieldOptions[field.key] ?? [];
  }

  onFieldBlur(field: CrudField): void {
    if (field.key === 'username' && this.formModel['username'] && !this.loadedEntityKeyValue) {
      const usernameRaw = this.formModel['username'];
      const username = typeof usernameRaw === 'string' ? usernameRaw.trim() : '';
      if (!username) {
        this.usernameTaken = false;
        return;
      }

      this.http.get<unknown[]>(`${environment.apiBaseUrl}/users/search`, { params: { username } }).subscribe({
        next: (users) => {
          this.usernameTaken = Array.isArray(users) && users.length > 0;
        },
        error: () => {
          this.usernameTaken = false;
        }
      });
    }

    if (field.key === 'username' && !this.formModel['username']) {
      this.usernameTaken = false;
    }
  }

  shouldShowRequiredError(field: CrudField, control: NgModel | null): boolean {
    if (field.required !== true || control === null) {
      return false;
    }

    return control.invalid === true
      && (control.touched === true || control.dirty === true || this.submissionAttempted);
  }

  onSelectChange(field: CrudField, value: unknown): void {
    this.formModel[field.key] = value;
    this.applyRelatedFields(field, value);
    this.resetFieldsOnChange(field);
    this.loadSelectOptions();
  }

  save(form: NgForm): void {
    this.submissionAttempted = true;
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (this.usernameTaken) {
      this.pushOperationLog('error', 'users.error.username.taken');
      return;
    }

    const payload = this.buildPayload();
    // eslint-disable-next-line no-console
    console.log('[CrudPageComponent] Saving payload for endpoint', this.endpoint, ':', payload);

    if (this.loadedEntityKeyValue !== null) {
      this.http
        .put<CrudEntity>(`${environment.apiBaseUrl}/${this.endpoint}/${this.loadedEntityKeyValue}`, payload)
        .subscribe({
          next: () => {
            this.resetForm();
            this.pushOperationLog('success', 'crud.success.update');
          },
          error: (error) => {
            // eslint-disable-next-line no-console
            console.error('[CrudPageComponent] Update failed for endpoint', this.endpoint, 'payload:', payload, 'error:', error);
            const message = this.buildErrorMessage('crud.error.update', error);
            this.pushOperationLog('error', message);
          }
        });
      return;
    }

    this.http.post<CrudEntity>(`${environment.apiBaseUrl}/${this.endpoint}`, payload).subscribe({
      next: () => {
        this.resetForm();
        this.pushOperationLog('success', 'crud.success.create');
      },
      error: (error) => {
        // eslint-disable-next-line no-console
        console.error('[CrudPageComponent] Create failed for endpoint', this.endpoint, 'payload:', payload, 'error:', error);
        const message = this.buildErrorMessage('crud.error.create', error);
        this.pushOperationLog('error', message);
      }
    });
  }

  resetForm(): void {
    this.formModel = {};
    this.loadedEntityKeyValue = null;
    this.usernameTaken = false;
    this.submissionAttempted = false;
    this.loadSelectOptions();
  }

  cancel(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl(this.getDefaultRoute());
  }

  private async initializePage(): Promise<void> {
    this.activeFolder = this.folders[0]?.key ?? '';
    this.loadSelectOptions();

    const idParam = this.route.snapshot.queryParamMap.get(this.entityKey) ?? this.route.snapshot.paramMap.get(this.entityKey);
    const modeParam = this.route.snapshot.queryParamMap.get('mode');

    if (modeParam === 'view') {
      this.isViewMode = true;
    }

    if ((!idParam || idParam === 'new') && this.moduleCode && this.createFunctionCode) {
      const canCreate = await this.canUseFunction(this.createFunctionCode);
      if (!canCreate) {
        void this.router.navigateByUrl('/forbidden');
        return;
      }
    }

    if (idParam && idParam !== 'new' && !this.isViewMode && this.moduleCode && this.updateFunctionCode) {
      const canUpdate = await this.canUseFunction(this.updateFunctionCode);
      if (!canUpdate) {
        void this.router.navigateByUrl('/forbidden');
        return;
      }
    }

    if (idParam && idParam !== 'new') {
      this.loadById(idParam);
    }

    if (this.fieldPermissionsEndpoint) {
      this.loadFieldPermissions();
    }
  }

  private async canUseFunction(functionCode: string): Promise<boolean> {
    try {
      return await this.functionAuthorizationService.canUseFunction(this.moduleCode, functionCode);
    } catch {
      return false;
    }
  }

  private applyInitialFormModel(source: string): void {
    if (this.loadedEntityKeyValue !== null) {
      return;
    }

    if (Object.keys(this.initialFormModel ?? {}).length === 0) {
      return;
    }

    this.formModel = {
      ...this.formModel,
      ...this.initialFormModel
    };

    // eslint-disable-next-line no-console
    console.log(`[CrudPageComponent] Applied initial form model from ${source}:`, this.formModel);
  }

  private buildPayload(): CrudEntity {
    return this.getAllFields()
      .filter((field) => !field.createOnly || this.loadedEntityKeyValue === null)
      .reduce<CrudEntity>((accumulator, field) => {
        accumulator[field.key] = this.formModel[field.key];
        return accumulator;
      }, {});
  }

  private shouldDisplayField(field: CrudField): boolean {
    return !field.hidden
      && !(field.createOnly === true && this.loadedEntityKeyValue !== null)
      && !this.isFieldHidden(field.key);
  }

  private loadSelectOptions(): void {
    for (const field of this.getAllFields().filter((currentField) => currentField.type === 'select')) {
      if (field.options && field.options.length > 0) {
        this.fieldOptions[field.key] = field.options.map((option) => ({
          value: option.value,
          label: option.label,
          source: {
            value: option.value,
            label: option.label
          }
        }));
        this.applyRelatedFields(field, this.formModel[field.key]);
        continue;
      }

      if (!field.optionsEndpoint) {
        this.fieldOptions[field.key] = [];
        continue;
      }

      const resolvedEndpoint = this.resolveOptionsEndpoint(field);
      if (!resolvedEndpoint) {
        this.fieldOptions[field.key] = [];
        continue;
      }

      this.http.get<Record<string, unknown>[]>(`${environment.apiBaseUrl}/${resolvedEndpoint}`).subscribe({
        next: (items) => {
          this.fieldOptions[field.key] = (items ?? [])
            .map((item) => this.mapToSelectOption(field, item))
            .filter((option): option is SelectOption => option !== null);
          this.applyRelatedFields(field, this.formModel[field.key]);
        },
        error: () => {
          this.fieldOptions[field.key] = [];
        }
      });
    }
  }

  private mapToSelectOption(field: CrudField, item: Record<string, unknown>): SelectOption | null {
    const valueKey = field.optionValueKey ?? 'id';
    const labelKey = field.optionLabelKey ?? 'name';
    const rawValue = item[valueKey];

    if (typeof rawValue !== 'string' && typeof rawValue !== 'number') {
      return null;
    }

    const rawLabel = item[labelKey];
    const value = rawValue;
    const baseLabel = typeof rawLabel === 'string' && rawLabel.trim().length > 0
      ? rawLabel
      : String(rawValue);
    const label = field.includeValueInOptionLabel === true && baseLabel !== String(rawValue)
      ? `${rawValue} - ${baseLabel}`
      : baseLabel;

    return {
      value,
      label,
      source: item
    };
  }

  private applyRelatedFields(field: CrudField, value: unknown): void {
    if (!field.relatedFields) {
      return;
    }

    const normalizedValue = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
    const option = this.getFieldOptions(field).find((currentOption) => String(currentOption.value) === normalizedValue);

    for (const [targetField, sourceField] of Object.entries(field.relatedFields)) {
      this.formModel[targetField] = option?.source[sourceField] ?? '';
    }
  }

  private getAllFields(): CrudField[] {
    const mergedFields = [...this.fields, ...this.folders.flatMap((folder) => folder.fields)];
    const uniqueFields = new Map<string, CrudField>();
    for (const field of mergedFields) {
      uniqueFields.set(field.key, field);
    }
    return Array.from(uniqueFields.values());
  }

  private resetFieldsOnChange(field: CrudField): void {
    for (const targetField of field.resetFieldsOnChange ?? []) {
      this.formModel[targetField] = targetField.endsWith('Id') ? null : '';
    }
  }

  private hasUnresolvedSelectDependencies(field: CrudField): boolean {
    return field.type === 'select'
      && !!field.optionsEndpoint
      && this.resolveOptionsEndpoint(field) === null
      && this.extractEndpointPlaceholders(field.optionsEndpoint).length > 0;
  }

  private resolveOptionsEndpoint(field: CrudField): string | null {
    if (!field.optionsEndpoint) {
      return null;
    }

    let hasMissingValue = false;
    const resolvedEndpoint = field.optionsEndpoint.replace(/\{(\w+)\}/g, (_match, placeholder: string) => {
      const rawValue = this.formModel[placeholder];
      if (rawValue === null || rawValue === undefined || String(rawValue).trim().length === 0) {
        hasMissingValue = true;
        return '';
      }
      return encodeURIComponent(String(rawValue));
    });

    return hasMissingValue ? null : resolvedEndpoint;
  }

  private extractEndpointPlaceholders(optionsEndpoint: string): string[] {
    return Array.from(optionsEndpoint.matchAll(/\{(\w+)\}/g), (match) => match[1]);
  }

  private getFieldPermission(fieldKey: string): string {
    return this.fieldPermissions[fieldKey] ?? 'full-edit';
  }

  private isFieldHidden(fieldKey: string): boolean {
    return this.getFieldPermission(fieldKey) === 'hide-field';
  }

  private loadFieldPermissions(): void {
    this.http.get<Record<string, string>>(`${environment.apiBaseUrl}/${this.fieldPermissionsEndpoint}`).subscribe({
      next: (permissions) => {
        this.fieldPermissions = permissions ?? {};
      },
      error: () => {
        this.fieldPermissions = {};
      }
    });
  }

  private loadById(id: string | number): void {
    this.http.get<CrudEntity>(`${environment.apiBaseUrl}/${this.endpoint}/${id}`).subscribe({
      next: (entity) => {
        this.loadedEntityKeyValue = id;
        this.formModel = { ...entity };
        this.submissionAttempted = false;
        this.usernameTaken = false;
        this.loadSelectOptions();
        for (const field of this.getAllFields().filter((currentField) => currentField.type === 'select')) {
          this.applyRelatedFields(field, this.formModel[field.key]);
        }
      },
      error: (error) => {
        const message = this.buildErrorMessage('crud.error.load', error);
        this.pushOperationLog('error', message);
      }
    });
  }

  /**
   * Aggiunge un messaggio di log (success/error) e lo rimuove automaticamente dopo 10s (success) o 20s (error).
   */
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
    const reason = this.extractErrorReason(error);
    if (reason) {
      return `${this.translate(messageKey)} ${this.translate('common.reason')}: ${reason}`;
    }
    return this.translate(messageKey);
  }

  private extractErrorReason(error: unknown): string | null {
    if (!(error instanceof HttpErrorResponse)) {
      return null;
    }

    const responseError = error.error;
    if (typeof responseError === 'string') {
      const parsedReason = this.extractJsonStringErrorReason(responseError);
      return parsedReason ?? this.normalizeErrorReason(responseError);
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
        const nestedReason = this.extractJsonStringErrorReason(candidate);
        return nestedReason ?? candidate;
      }

      if (candidate && typeof candidate === 'object') {
        const nestedReason = this.findObjectErrorReason(candidate as Record<string, unknown>);
        if (nestedReason) {
          return nestedReason;
        }
      }
    }

    return null;
  }

  private extractJsonStringErrorReason(responseError: string): string | null {
    const normalizedResponseError = responseError.trim();
    const directCandidate = this.extractReasonFromJsonCandidate(normalizedResponseError);
    if (directCandidate) {
      return directCandidate;
    }

    const jsonStartIndex = normalizedResponseError.indexOf('{');
    const jsonEndIndex = normalizedResponseError.lastIndexOf('}');
    if (jsonStartIndex < 0 || jsonEndIndex <= jsonStartIndex) {
      return null;
    }

    return this.extractReasonFromJsonCandidate(normalizedResponseError.slice(jsonStartIndex, jsonEndIndex + 1));
  }

  private extractReasonFromJsonCandidate(jsonCandidate: string): string | null {
    try {
      const parsedCandidate = JSON.parse(jsonCandidate) as unknown;
      return this.extractReasonFromParsedJson(parsedCandidate);
    } catch {
      return null;
    }
  }

  private extractReasonFromParsedJson(parsedValue: unknown): string | null {
    if (!parsedValue) {
      return null;
    }

    if (typeof parsedValue === 'string') {
      const nestedReason = this.extractJsonStringErrorReason(parsedValue);
      return nestedReason ?? this.normalizeErrorReason(parsedValue);
    }

    if (typeof parsedValue !== 'object') {
      return null;
    }

    const candidate = this.findObjectErrorReason(parsedValue as Record<string, unknown>);
    return candidate ? this.normalizeErrorReason(candidate) : null;
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

  private getDefaultRoute(): string {
    return `/${this.endpoint.replace(/\/search$/, '')}`;
  }
}