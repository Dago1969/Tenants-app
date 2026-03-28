import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { t, MessageKey } from '../../i18n/messages';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';
import { AslAddWizardComponent } from '../../shared/asl-add-wizard.component';

/**
 * Pagina di ricerca strutture per tipo, con collegamento al form di gestione dedicato.
 */
@Component({
  selector: 'app-structure-search',
  standalone: true,
  imports: [SearchPageComponent, AslAddWizardComponent],
  template: `
    <button class="btn btn-primary" style="margin-bottom: 1rem;" (click)="openAslWizard()">
      <span class="icon">＋</span> {{ translate('crud.actions.new') }} ASL
    </button>
    <app-search-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [filters]="filters"
      [resultColumns]="resultColumns"
      [fixedParams]="fixedParams"
      [createRoute]="createRoute"
      [detailRouteBase]="detailRouteBase"
      [moduleCode]="moduleCode"
      [createFunctionCode]="createFunctionCode"
      [autoSearch]="true"
      [showViewAction]="false"
    />
    <asl-add-wizard *ngIf="showAslWizard" (close)="closeAslWizard()"></asl-add-wizard>
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
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.titleKey = (this.route.snapshot.data['titleKey'] ?? 'structures.title') as MessageKey;
    const structureType = String(this.route.snapshot.data['structureType'] ?? 'ASL');
    this.fixedParams = { structureType };
    if (structureType === 'ASL') {
      this.createRoute = '/structures/asl/add';
      this.detailRouteBase = '/structures/asl/manage';
    } else {
      const manageRoute = String(this.route.snapshot.data['manageRoute'] ?? '/structures/asl/manage');
      this.createRoute = manageRoute;
      this.detailRouteBase = manageRoute;
    }
    this.routeSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showAslWizard = this.router.url.endsWith('/structures/asl/add');
      }
    });
    this.showAslWizard = this.router.url.endsWith('/structures/asl/add');
  }

  ngOnDestroy(): void {
    if (this.routeSub && typeof this.routeSub.unsubscribe === 'function') {
      this.routeSub.unsubscribe();
    }
  }

  openAslWizard() {
    this.router.navigate(['/structures/asl/add']);
  }

  closeAslWizard() {
    this.router.navigate(['/structures/asl']);
  }

  translate(key: MessageKey): string {
    return t(key);
  }
}
