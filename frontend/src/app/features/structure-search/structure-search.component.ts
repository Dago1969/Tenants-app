import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { t, MessageKey } from '../../i18n/messages';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';
import { AddWizardComponentAsl } from '../../shared/add-wizard.component-asl';
import { FunctionAuthorizationService } from '../../core/function-authorization.service';

/**
 * Pagina di ricerca strutture per tipo, con collegamento al form di gestione dedicato.
 */
@Component({
  selector: 'app-structure-search',
  standalone: true,
  imports: [CommonModule, SearchPageComponent, AddWizardComponentAsl],
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
      [showViewAction]="false"
      [showCreateAction]="false"
      [interceptEditAction]="interceptEditAction"
      (editAction)="openAslWizard($event)"
    >
      <button search-header-action class="btn btn-primary" style="margin-left: 0.5rem;" (click)="openAslWizard()" *ngIf="showCreateAction && canCreate">
        <span class="icon">＋</span> {{ translate('crud.actions.new') }} ASL
      </button>
    </app-search-page>
    <add-wizard-component-asl
      *ngIf="showAslWizard"
      [structureId]="selectedAslStructureId"
      (close)="closeAslWizard()"
    ></add-wizard-component-asl>
  `
})
export class StructureSearchComponent implements OnInit, OnDestroy {
  @ViewChild(SearchPageComponent) private searchPage?: SearchPageComponent;

  /**
   * Proprietà per la visibilità e permesso creazione ASL (default true, da adattare se serve logica custom)
   */
  showCreateAction = true;
  canCreate = true;
  showAslWizard = false;
  selectedAslStructureId: number | null = null;
  interceptEditAction = false;
  private routeSub: any = null;
  titleKey = 'structures.title' as MessageKey;
  endpoint = 'structures';
  fixedParams: Record<string, string> = {};
  createRoute = '';
  detailRouteBase = '';
  moduleCode = 'STRUCTURE';
  createFunctionCode = 'CREATE';

  filters: SearchField[] = [
    { key: 'code', labelKey: 'structures.field.code', type: 'text' },
    { key: 'name', labelKey: 'structures.field.name', type: 'text' },
    { key: 'city', labelKey: 'structures.field.city', type: 'text' }
  ];

  resultColumns: SearchField[] = [
    { key: 'code', labelKey: 'structures.field.code', type: 'text' },
    { key: 'name', labelKey: 'structures.field.name', type: 'text' },
    { key: 'city', labelKey: 'structures.field.city', type: 'text' },
    { key: 'region', labelKey: 'structures.field.region', type: 'text' },
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
    this.fixedParams = { structureType };
    if (structureType === 'ASL') {
      this.createRoute = '';
      this.detailRouteBase = '/structures/asl/manage';
      this.interceptEditAction = true;
    } else {
      const manageRoute = String(this.route.snapshot.data['manageRoute'] ?? '/structures/asl/manage');
      this.createRoute = manageRoute;
      this.detailRouteBase = manageRoute;
      this.interceptEditAction = false;
    }
    // Nessuna gestione di route per il wizard
    this.showAslWizard = false;

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

  openAslWizard(structureId?: string | number) {
    this.selectedAslStructureId = this.normalizeStructureId(structureId);
    this.showAslWizard = true;
    this.cdr.detectChanges();
  }

  closeAslWizard() {
    this.selectedAslStructureId = null;
    this.showAslWizard = false;
    this.searchPage?.search(false);
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
