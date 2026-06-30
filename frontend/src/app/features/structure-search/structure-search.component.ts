import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { t, MessageKey } from '../../i18n/messages';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';
import { AddWizardComponentAsl } from '../../shared/add-wizard.component-asl';
import { AddWizardComponentHospital } from '../../shared/add-wizard.component-hospital';
import { AddWizardComponentPharmacy } from '../../shared/add-wizard.component-pharmacy';
import { STRUCTURE_MODULE_CODES } from '../../core/structure-module-codes';
import { FunctionAuthorizationService } from '../../core/function-authorization.service';

type PopupStructureType =
  | 'ASL'
  | 'HOSPITAL'
  | 'HOSPITAL_PHARMACY'
  | 'RETAIL_PHARMACY'
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
      [fixedParams]="fixedParams"
      [detailRouteBase]="detailRouteBase"
      [moduleCode]="moduleCode"
      [createFunctionCode]="createFunctionCode"
      [autoSearch]="true"
      [showCreateAction]="false"
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
    { key: 'active', labelKey: 'search.column.status', type: 'text' },
    { key: 'parentStructureName', labelKey: 'structures.field.parentStructureId', type: 'text' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    private readonly functionAuthorizationService: FunctionAuthorizationService
  ) {}

  ngOnInit(): void {
    this.titleKey = (this.route.snapshot.data['titleKey'] ?? 'structures.title') as MessageKey;
    const structureType = String(this.route.snapshot.data['structureType'] ?? 'ASL');
    this.moduleCode = String(this.route.snapshot.data['moduleCode'] ?? STRUCTURE_MODULE_CODES.GENERIC);
    this.popupStructureType = this.normalizePopupStructureType(structureType);
    this.fixedParams = { structureType };
    if (this.popupStructureType === 'ASL') {
      this.showCreateAction = false;
      this.filters = [
        { key: 'code', labelKey: 'structures.field.code', type: 'text' },
        { key: 'name', labelKey: 'structures.field.name', type: 'text' },
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
      this.resultColumns = [
        { key: 'code', labelKey: 'structures.field.code', type: 'text' },
        { key: 'name', labelKey: 'structures.field.name', type: 'text' },
        { key: 'address', labelKey: 'structures.field.address', type: 'text' },
        { key: 'email', labelKey: 'structures.field.email', type: 'text' },
        { key: 'phone', labelKey: 'structures.field.phone', type: 'text' },
        { key: 'active', labelKey: 'search.column.status', type: 'text' }
      ];
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
    if (this.popupStructureType === 'ASL' && this.selectedStructureId === null) {
      return;
    }
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

  getManagedPopupStructureType(): 'HOSPITAL_PHARMACY' | 'RETAIL_PHARMACY' | 'LOGISTICS_WAREHOUSE' | 'MATERIAL_WAREHOUSE' | 'PHARMA_COMPANY' | 'SPECIALIST_CLINIC' {
    switch (this.popupStructureType) {
      case 'HOSPITAL_PHARMACY':
      case 'RETAIL_PHARMACY':
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
        return 'structures.type.hospitalPharmacy.label';
      case 'RETAIL_PHARMACY':
        return 'structures.type.retailPharmacy.label';
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
        return '/structures/hospital-pharmacies/manage';
      case 'RETAIL_PHARMACY':
        return '/structures/retail-pharmacies/manage';
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

  translate(key: MessageKey): string {
    return t(key);
  }
}
