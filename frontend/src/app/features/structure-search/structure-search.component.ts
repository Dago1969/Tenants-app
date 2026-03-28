import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { t, MessageKey } from '../../i18n/messages';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';
import { AddWizardComponentAsl } from '../../shared/add-wizard.component-asl';

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
    >
      <button search-header-action class="btn btn-primary" style="margin-left: 0.5rem;" (click)="openAslWizard()">
        <span class="icon">＋</span> {{ translate('crud.actions.new') }} ASL
      </button>
    </app-search-page>
    <add-wizard-component-asl *ngIf="showAslWizard" (close)="closeAslWizard()"></add-wizard-component-asl>
  `
})
export class StructureSearchComponent implements OnInit, OnDestroy {
  showAslWizard = false;
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
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.titleKey = (this.route.snapshot.data['titleKey'] ?? 'structures.title') as MessageKey;
    const structureType = String(this.route.snapshot.data['structureType'] ?? 'ASL');
    this.fixedParams = { structureType };
    if (structureType === 'ASL') {
      this.createRoute = '';
      this.detailRouteBase = '/structures/asl/manage';
    } else {
      const manageRoute = String(this.route.snapshot.data['manageRoute'] ?? '/structures/asl/manage');
      this.createRoute = manageRoute;
      this.detailRouteBase = manageRoute;
    }
    // Nessuna gestione di route per il wizard
    this.showAslWizard = false;
  }

  ngOnDestroy(): void {
    if (this.routeSub && typeof this.routeSub.unsubscribe === 'function') {
      this.routeSub.unsubscribe();
    }
  }

  openAslWizard() {
    console.log('[StructureSearchComponent] openAslWizard: click su Nuova ASL');
    this.showAslWizard = true;
    this.cdr.detectChanges();
  }

  closeAslWizard() {
    console.log('[StructureSearchComponent] EVENT closeAslWizard: ricevuto evento close dal wizard');
    this.showAslWizard = false;
  }

  translate(key: MessageKey): string {
    return t(key);
  }
}
