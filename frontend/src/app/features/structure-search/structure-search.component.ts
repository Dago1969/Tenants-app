import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { t, MessageKey } from '../../i18n/messages';
import { SearchField, SearchPageComponent, SearchPrintSection, SearchResult, SearchViewValueFormatter } from '../../shared/search-page.component';
import { AddWizardComponentAsl } from '../../shared/add-wizard.component-asl';
import { AddWizardComponentHospital } from '../../shared/add-wizard.component-hospital';
import { AddWizardComponentPharmacy } from '../../shared/add-wizard.component-pharmacy';
import { STRUCTURE_MODULE_CODES } from '../../core/structure-module-codes';
import { FunctionAuthorizationService } from '../../core/function-authorization.service';
import { DepartmentDto, PharmacyApiService, PharmacyDto } from '../../core/pharmacy-api.service';

type PopupStructureType =
  | 'ASL'
  | 'HOSPITAL'
  | 'HOSPITAL_PHARMACY'
  | 'RETAIL_PHARMACY'
  | 'PHARMACY'
  | 'LOGISTICS_WAREHOUSE'
  | 'MATERIAL_WAREHOUSE'
  | 'PHARMA_COMPANY'
  | 'SPECIALIST_CLINIC';

/**
 * Pagina di ricerca strutture per tipo, con collegamento al form di gestione dedicato.
 */
@Component({
  selector: 'app-structure-search',
  standalone: true,
  imports: [CommonModule, SearchPageComponent, AddWizardComponentAsl, AddWizardComponentHospital, AddWizardComponentPharmacy],
  template: `
    <app-search-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [filters]="filters"
      [resultColumns]="resultColumns"
      [resultIdLabelKey]="resultIdLabelKey"
      [fixedParams]="fixedParams"
      [detailRouteBase]="detailRouteBase"
      [moduleCode]="moduleCode"
      [createFunctionCode]="createFunctionCode"
      [autoSearch]="true"
      [showCreateAction]="false"
      [printSections]="printSections"
      [viewLabelKeys]="viewLabelKeys"
      [viewValueFormatter]="formatDetailValue"
      [interceptEditAction]="interceptEditAction"
      (editAction)="openStructureWizard($event)"
    >
      <button search-header-action class="btn btn-primary" style="margin-left: 0.5rem;" (click)="openStructureWizard()" *ngIf="showCreateAction && canCreate">
        <span class="icon">＋</span> {{ translate('crud.actions.new') }} {{ translate(getStructureTypeLabelKey()) }}
      </button>
    </app-search-page>
    <add-wizard-component-asl
      *ngIf="showStructureWizard && popupStructureType === 'ASL'"
      [structureId]="selectedStructureId"
      (close)="closeStructureWizard()"
    ></add-wizard-component-asl>
    <add-wizard-component-hospital
      *ngIf="showStructureWizard && popupStructureType === 'HOSPITAL'"
      [structureId]="selectedStructureId"
      (close)="closeStructureWizard()"
    ></add-wizard-component-hospital>
    <add-wizard-component-pharmacy
      *ngIf="showStructureWizard && isManagedStructurePopup()"
      [structureId]="selectedStructureId"
      [structureType]="getManagedPopupStructureType()"
      (close)="closeStructureWizard()"
    ></add-wizard-component-pharmacy>
  `
})
export class StructureSearchComponent implements OnInit, OnDestroy {
  @ViewChild(SearchPageComponent) private searchPage?: SearchPageComponent;

  /**
   * Proprietà per la visibilità e permesso creazione ASL (default true, da adattare se serve logica custom)
   */
  showCreateAction = true;
  canCreate = true;
  showStructureWizard = false;
  selectedStructureId: number | null = null;
  popupStructureType: PopupStructureType = 'ASL';
  interceptEditAction = false;
  private routeSub: any = null;
  titleKey = 'structures.title' as MessageKey;
  endpoint = 'structures';
  fixedParams: Record<string, string> = {};
  createRoute = '';
  detailRouteBase = '';
  moduleCode: string = STRUCTURE_MODULE_CODES.GENERIC;
  createFunctionCode = 'CREATE';
  resultIdLabelKey = 'common.id' as MessageKey;
  printSections: SearchPrintSection[] = [];
  viewLabelKeys: Record<string, MessageKey> = {};
  private departmentsList: DepartmentDto[] = [];
  private selectablePharmacies: PharmacyDto[] = [];

  filters: SearchField[] = [
    { key: 'code', labelKey: 'structures.field.code', type: 'text' },
    { key: 'name', labelKey: 'structures.field.name', type: 'text' },
    { key: 'city', labelKey: 'structures.field.city', type: 'text' },
    {
      key: 'active',
      labelKey: 'search.column.status',
      type: 'select',
      options: [
        { value: 'true', label: 'status.attivo' },
        { value: 'false', label: 'status.inattivo' }
      ]
    }
  ];

  resultColumns: SearchField[] = [
    { key: 'code', labelKey: 'structures.field.code', type: 'text' },
    { key: 'name', labelKey: 'structures.field.name', type: 'text' },
    { key: 'city', labelKey: 'structures.field.city', type: 'text' },
    { key: 'region', labelKey: 'structures.field.region', type: 'text' },
    { key: 'structureType', labelKey: 'structures.field.structureType', type: 'text' },
    { key: 'active', labelKey: 'search.column.status', type: 'text' },
    { key: 'parentStructureName', labelKey: 'structures.field.parentStructureId', type: 'text' }
  ];

  // Options used to render structure type selects and to build display maps
  private readonly structureTypeOptions = [
    { value: 'ASL', label: 'structures.type.asl.label' },
    { value: 'HOSPITAL', label: 'structures.type.hospital.label' },
    { value: 'HOSPITAL_PHARMACY', label: 'structures.type.hospitalPharmacy.label' },
    { value: 'RETAIL_PHARMACY', label: 'structures.type.retailPharmacy.label' },
    { value: 'TERRITORIAL_PHARMACY', label: 'structures.type.territorialPharmacy.label' },
    { value: 'LOGISTICS_WAREHOUSE', label: 'structures.type.logisticsWarehouse.label' },
    { value: 'MATERIAL_WAREHOUSE', label: 'structures.type.materialWarehouse.label' },
    { value: 'PHARMA_COMPANY', label: 'structures.type.pharmaCompany.label' },
    { value: 'SPECIALIST_CLINIC', label: 'structures.type.specialistClinic.label' }
  ];

  private readonly pharmacyStructureTypeOptions = [
    { value: 'HOSPITAL_PHARMACY', label: 'structures.type.hospitalPharmacy.label' },
    { value: 'RETAIL_PHARMACY', label: 'structures.type.retailPharmacy.label' },
    { value: 'TERRITORIAL_PHARMACY', label: 'structures.type.territorialPharmacy.label' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    private readonly functionAuthorizationService: FunctionAuthorizationService,
    private readonly pharmacyApi: PharmacyApiService
  ) {}

  ngOnInit(): void {
    this.titleKey = (this.route.snapshot.data['titleKey'] ?? 'structures.title') as MessageKey;
    const structureType = String(this.route.snapshot.data['structureType'] ?? 'ASL');
    this.moduleCode = String(this.route.snapshot.data['moduleCode'] ?? STRUCTURE_MODULE_CODES.GENERIC);
    this.popupStructureType = this.normalizePopupStructureType(structureType);
    if (structureType === 'PHARMACY') {
      // search across all pharmacy-related types
      this.fixedParams = { structureTypes: 'HOSPITAL_PHARMACY,RETAIL_PHARMACY,TERRITORIAL_PHARMACY' };
    } else {
      this.fixedParams = { structureType };
    }
    if (this.isPopupWizardStructureType(this.popupStructureType)) {
      this.createRoute = '';
      this.detailRouteBase = this.resolveDetailRouteBase(this.popupStructureType);
      this.interceptEditAction = true;
    } else {
      const manageRoute = String(this.route.snapshot.data['manageRoute'] ?? '/structures/asl/manage');
      this.createRoute = manageRoute;
      this.detailRouteBase = manageRoute;
      this.interceptEditAction = false;
    }
    this.showStructureWizard = false;
    this.configureDetailView();
    this.loadDetailLookups();

    const baseFilters: SearchField[] = [
      { key: 'code', labelKey: 'structures.field.code', type: 'text' },
      { key: 'name', labelKey: 'structures.field.name', type: 'text' },
      { key: 'city', labelKey: 'structures.field.city', type: 'text' },
      {
        key: 'active',
        labelKey: 'search.column.status',
        type: 'select',
        options: [
          { value: 'true', label: 'status.attivo' },
          { value: 'false', label: 'status.inattivo' }
        ]
      }
    ];

    this.filters = structureType === 'PHARMACY'
      ? [
          ...baseFilters.slice(0, 3),
          {
            key: 'structureType',
            labelKey: 'structures.field.structureType',
            type: 'select',
            options: this.pharmacyStructureTypeOptions.map((option) => ({ value: option.value, label: option.label }))
          },
          baseFilters[3]
        ]
      : baseFilters;

    if (structureType === 'ASL') {
      this.filters = [
        { key: 'code', labelKey: 'structures.field.code', type: 'text' },
        {
          key: 'region',
          labelKey: 'structures.field.regione',
          type: 'select',
          optionsEndpoint: 'geography/regions',
          optionValueKey: 'name',
          optionLabelKey: 'name'
        },
        { key: 'name', labelKey: 'structures.field.denom', type: 'text' }
      ];

      this.resultColumns = [
        { key: 'code', labelKey: 'structures.field.code', type: 'text' },
        { key: 'name', labelKey: 'structures.field.denom', type: 'text' },
        { key: 'region', labelKey: 'structures.field.regione', type: 'text' },
        { key: 'province', labelKey: 'structures.field.province', type: 'text' },
        { key: 'address', labelKey: 'structures.field.address', type: 'text' },
        { key: 'email', labelKey: 'structures.field.email', type: 'text' },
        { key: 'phone', labelKey: 'structures.field.phone', type: 'text' }
      ];
    }

    if (structureType === 'HOSPITAL') {
      this.filters = [
        { key: 'code', labelKey: 'structures.field.code', type: 'text' },
        {
          key: 'region',
          labelKey: 'structures.field.regione',
          type: 'select',
          optionsEndpoint: 'geography/regions',
          optionValueKey: 'name',
          optionLabelKey: 'name'
        },
        { key: 'parentStructureName', labelKey: 'structures.field.parentAsl', type: 'text' },
        { key: 'name', labelKey: 'structures.field.denom', type: 'text' }
      ];

      this.resultColumns = [
        { key: 'year', labelKey: 'therapeuticPlan.medicalRecord.field.diagnosisYear', type: 'text' },
        { key: 'region', labelKey: 'structures.field.regione', type: 'text' },
        { key: 'parentStructureName', labelKey: 'structures.field.parentAsl', type: 'text' },
        { key: 'code', labelKey: 'structures.field.code', type: 'text' },
        { key: 'name', labelKey: 'structures.field.denom', type: 'text' },
        { key: 'city', labelKey: 'structures.field.city', type: 'text' },
        { key: 'structureTypeDescription', labelKey: 'structures.field.structureType', type: 'text' }
      ];
    }

    // Populate result column display map for structureType so codes are shown as localized labels
    const structureTypeMap: Record<string, string> = this.buildStructureTypeDisplayMap();
    const typeColumn = this.resultColumns.find((c) => c.key === 'structureType');
    if (typeColumn) {
      typeColumn.displayValueMap = structureTypeMap;
    }

    // Logica permessi creazione ASL
    this.loadActionPermissions();
  }

  private async loadActionPermissions(): Promise<void> {
    if (!this.moduleCode) {
      this.canCreate = true;
      return;
    }
    this.canCreate = await this.resolveActionPermission(this.createFunctionCode);
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

  ngOnDestroy(): void {
    if (this.routeSub && typeof this.routeSub.unsubscribe === 'function') {
      this.routeSub.unsubscribe();
    }
  }

  openStructureWizard(structureId?: string | number) {
    this.selectedStructureId = this.normalizeStructureId(structureId);
    this.showStructureWizard = true;
    this.cdr.detectChanges();
  }

  closeStructureWizard() {
    this.selectedStructureId = null;
    this.showStructureWizard = false;
    this.searchPage?.search(false);
  }

  isManagedStructurePopup(): boolean {
    return this.isPopupWizardStructureType(this.popupStructureType) && this.popupStructureType !== 'ASL' && this.popupStructureType !== 'HOSPITAL';
  }

  getManagedPopupStructureType(): 'HOSPITAL_PHARMACY' | 'RETAIL_PHARMACY' | 'PHARMACY' | 'LOGISTICS_WAREHOUSE' | 'MATERIAL_WAREHOUSE' | 'PHARMA_COMPANY' | 'SPECIALIST_CLINIC' {
    switch (this.popupStructureType) {
      case 'HOSPITAL_PHARMACY':
      case 'RETAIL_PHARMACY':
      case 'PHARMACY':
      case 'LOGISTICS_WAREHOUSE':
      case 'MATERIAL_WAREHOUSE':
      case 'PHARMA_COMPANY':
      case 'SPECIALIST_CLINIC':
        return this.popupStructureType;
      default:
        return 'HOSPITAL_PHARMACY';
    }
  }

  getStructureTypeLabelKey(): MessageKey {
    switch (this.popupStructureType) {
      case 'HOSPITAL':
        return 'structures.type.hospital.label';
      case 'HOSPITAL_PHARMACY':
      case 'RETAIL_PHARMACY':
        return 'structures.type.pharmacies.label';
      case 'PHARMACY':
        return 'structures.type.pharmacies.label';
      case 'LOGISTICS_WAREHOUSE':
        return 'structures.type.logisticsWarehouse.label';
      case 'MATERIAL_WAREHOUSE':
        return 'structures.type.materialWarehouse.label';
      case 'PHARMA_COMPANY':
        return 'structures.type.pharmaCompany.label';
      case 'SPECIALIST_CLINIC':
        return 'structures.type.specialistClinic.label';
      default:
        return 'structures.type.asl.label';
    }
  }

  private normalizePopupStructureType(structureType: string): PopupStructureType {
    return this.isPopupWizardStructureType(structureType) ? (structureType as PopupStructureType) : 'ASL';
  }

  private resolveDetailRouteBase(structureType: string): string {
    switch (structureType) {
      case 'ASL':
        return '/structures/asl/manage';
      case 'HOSPITAL':
        return '/structures/hospitals/manage';
      case 'HOSPITAL_PHARMACY':
      case 'RETAIL_PHARMACY':
        return '/structures/pharmacies/manage';
      case 'PHARMACY':
        return '/structures/pharmacies/manage';
      case 'LOGISTICS_WAREHOUSE':
        return '/structures/logistics-warehouses/manage';
      case 'MATERIAL_WAREHOUSE':
        return '/structures/material-warehouses/manage';
      case 'PHARMA_COMPANY':
        return '/structures/pharma-companies/manage';
      case 'SPECIALIST_CLINIC':
        return '/structures/specialist-clinics/manage';
      default:
        return '/structures/asl/manage';
    }
  }

  private isPopupWizardStructureType(structureType: string): boolean {
    return [
      'ASL',
      'HOSPITAL',
      'HOSPITAL_PHARMACY',
      'PHARMACY',
      'RETAIL_PHARMACY',
      'LOGISTICS_WAREHOUSE',
      'MATERIAL_WAREHOUSE',
      'PHARMA_COMPANY',
      'SPECIALIST_CLINIC'
    ].includes(structureType);
  }

  private normalizeStructureId(structureId?: string | number): number | null {
    if (typeof structureId === 'number' && !Number.isNaN(structureId)) {
      return structureId;
    }

    if (typeof structureId === 'string' && structureId.trim().length > 0) {
      const parsedId = Number(structureId);
      return Number.isNaN(parsedId) ? null : parsedId;
    }

    return null;
  }

  private buildStructureTypeDisplayMap(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const opt of this.structureTypeOptions) {
      map[opt.value] = this.translate(opt.label);
    }
    return map;
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  readonly formatDetailValue: SearchViewValueFormatter = (fieldKey, row) => {
    switch (fieldKey) {
      case 'referents':
        return this.formatReferents(row['referents']);
      case 'departmentsSelected':
        return this.formatDepartmentSelections(row['departmentsSelected'], row['referents']);
      case 'pharmacies':
        return this.formatPharmacies(row['pharmacies'] ?? row['hospitalPharmacyIds']);
      case 'serviceCalendarHours':
        return this.formatServiceCalendarHours(row['serviceCalendarHours']);
      default:
        return undefined;
    }
  };

  private configureDetailView(): void {
    this.viewLabelKeys = {
      parentStructureName: this.getParentStructureLabelKey(),
      referents: 'structures.field.referenceContacts',
      departmentsSelected: 'structures.field.departments',
      pharmacies: 'structures.field.referencePharmacies'
    };

    this.printSections = this.buildDetailSections();
  }

  private buildDetailSections(): SearchPrintSection[] {
    const commonFields = this.popupStructureType === 'HOSPITAL'
      ? ['name', 'code', 'parentStructureName', 'phone', 'region', 'province', 'city', 'address']
      : ['name', 'code', 'phone', 'region', 'province', 'city', 'address'];

    switch (this.popupStructureType) {
      case 'ASL':
        return [
          { titleKey: 'structures.step.generalData', descriptionKey: 'structures.step.generalData.desc', fields: commonFields },
          { titleKey: 'structures.step.specificData', descriptionKey: 'structures.step.specificData.desc', fields: ['pharmacies'] },
          { titleKey: 'structures.step.contacts', descriptionKey: 'structures.step.contacts.desc', fields: ['referents'] }
        ];
      case 'HOSPITAL':
        return [
          { titleKey: 'structures.step.generalData', descriptionKey: 'structures.step.generalData.desc', fields: commonFields },
          { titleKey: 'structures.step.specificData', descriptionKey: 'structures.step.specificData.hospital.desc', fields: ['departmentsSelected'] },
          { titleKey: 'structures.step.contacts', descriptionKey: 'structures.step.contacts.desc', fields: ['referents'] }
        ];
      default:
        return [
          { titleKey: 'structures.step.generalData', descriptionKey: 'structures.step.generalData.desc', fields: commonFields },
          { titleKey: 'structures.step.specificData', descriptionKey: this.getSpecificSectionDescriptionKey(), fields: ['description', 'serviceCalendarHours', 'active'] },
          { titleKey: 'structures.step.contacts', descriptionKey: 'structures.step.contacts.desc', fields: ['referents'] }
        ];
    }
  }

  private getSpecificSectionDescriptionKey(): MessageKey {
    return this.isManagedStructurePopup()
      ? 'structures.step.specificData.pharmacy.desc'
      : 'structures.step.specificData.structure.desc';
  }

  private getParentStructureLabelKey(): MessageKey {
    return this.popupStructureType === 'HOSPITAL'
      ? 'structures.field.parentAsl'
      : 'structures.field.parentStructureId';
  }

  private loadDetailLookups(): void {
    if (this.popupStructureType === 'HOSPITAL') {
      this.pharmacyApi.getDepartments().subscribe({
        next: (data) => {
          this.departmentsList = data ?? [];
        },
        error: () => {
          this.departmentsList = [];
        }
      });
    }

    if (this.popupStructureType === 'ASL') {
      this.pharmacyApi.getSelectablePharmacies().subscribe({
        next: (data) => {
          this.selectablePharmacies = data ?? [];
        },
        error: () => {
          this.selectablePharmacies = [];
        }
      });
    }
  }

  private formatReferents(rawReferents: unknown): string | undefined {
    if (!Array.isArray(rawReferents) || rawReferents.length === 0) {
      return undefined;
    }

    return rawReferents
      .map((referent) => this.formatSingleReferent(referent))
      .filter((value): value is string => Boolean(value))
      .join('\n\n');
  }

  private formatDepartmentSelections(rawSelections: unknown, rawReferents: unknown): string | undefined {
    if (!Array.isArray(rawSelections) || rawSelections.length === 0) {
      return undefined;
    }

    const referents = Array.isArray(rawReferents) ? rawReferents : [];

    return rawSelections
      .map((selection) => {
        const departmentId = typeof selection === 'object' && selection && 'departmentId' in selection
          ? Number((selection as { departmentId?: unknown }).departmentId)
          : NaN;
        if (Number.isNaN(departmentId)) {
          return '';
        }

        const referentId = typeof selection === 'object' && selection && 'referentId' in selection
          ? Number((selection as { referentId?: unknown }).referentId)
          : NaN;
        const referent = Number.isNaN(referentId)
          ? undefined
          : referents.find((candidate) => Number((candidate as { id?: unknown }).id) === referentId);

        const department = this.departmentsList.find((candidate) => candidate.id === departmentId);
        const lines = [
          `${department?.reparto ?? departmentId}${department?.areaFunzionale ? ` - ${department.areaFunzionale}` : ''}`
        ];
        const referentSummary = this.formatSingleReferent(referent);
        if (referentSummary) {
          lines.push(referentSummary);
        }

        return lines.join('\n');
      })
      .filter((value) => value.trim().length > 0)
      .join('\n\n');
  }

  private formatPharmacies(rawPharmacies: unknown): string | undefined {
    if (!Array.isArray(rawPharmacies) || rawPharmacies.length === 0) {
      return undefined;
    }

    return rawPharmacies
      .map((entry) => {
        const entryId = typeof entry === 'number'
          ? entry
          : typeof entry === 'object' && entry && 'id' in entry
            ? Number((entry as { id?: unknown }).id)
            : NaN;

        const mapped = this.selectablePharmacies.find((candidate) => candidate.id === entryId);
        if (mapped) {
          return `${mapped.name} - ${mapped.city}`;
        }

        if (typeof entry === 'object' && entry && 'name' in entry) {
          const name = String((entry as { name?: unknown }).name ?? '').trim();
          const city = String((entry as { city?: unknown }).city ?? '').trim();
          return city ? `${name} - ${city}` : name;
        }

        return Number.isNaN(entryId) ? '' : String(entryId);
      })
      .filter((value) => value.trim().length > 0)
      .join('\n');
  }

  private formatServiceCalendarHours(rawValue: unknown): string | undefined {
    if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(rawValue);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return rawValue;
      }

      return parsed
        .map((slot) => {
          const dayOfWeek = typeof slot?.dayOfWeek === 'string' ? slot.dayOfWeek : '';
          const openingTime = typeof slot?.openingTime === 'string' ? slot.openingTime : '';
          const closingTime = typeof slot?.closingTime === 'string' ? slot.closingTime : '';
          const dayLabel = this.humanizeDayOfWeek(dayOfWeek);
          return dayLabel && openingTime && closingTime ? `${dayLabel}: ${openingTime} - ${closingTime}` : '';
        })
        .filter((value) => value.trim().length > 0)
        .join('\n');
    } catch {
      return rawValue;
    }
  }

  private formatSingleReferent(rawReferent: unknown): string {
    if (!rawReferent || typeof rawReferent !== 'object') {
      return '';
    }

    const referent = rawReferent as { firstName?: unknown; lastName?: unknown; role?: unknown; email?: unknown; phone?: unknown };
    const fullName = `${String(referent.firstName ?? '').trim()} ${String(referent.lastName ?? '').trim()}`.trim();
    const role = String(referent.role ?? '').trim();
    const email = String(referent.email ?? '').trim();
    const phone = String(referent.phone ?? '').trim();
    const lines = [fullName || '-'];

    if (role) {
      lines[0] = `${lines[0]} - ${role}`;
    }
    if (email) {
      lines.push(`${this.translate('referent.field.email')}: ${email}`);
    }
    if (phone) {
      lines.push(`${this.translate('referent.field.phone')}: ${phone}`);
    }

    return lines.join('\n');
  }

  private humanizeDayOfWeek(dayOfWeek: string): string {
    const normalized = dayOfWeek.trim().toUpperCase();
    const labels: Record<string, string> = {
      MONDAY: 'Lunedi',
      TUESDAY: 'Martedi',
      WEDNESDAY: 'Mercoledi',
      THURSDAY: 'Giovedi',
      FRIDAY: 'Venerdi',
      SATURDAY: 'Sabato',
      SUNDAY: 'Domenica'
    };

    return labels[normalized] ?? dayOfWeek;
  }
}
