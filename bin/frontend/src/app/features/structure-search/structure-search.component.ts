import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageKey } from '../../i18n/messages';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';

/**
 * Pagina di ricerca strutture per tipo, con collegamento al form di gestione dedicato.
 */
@Component({
  selector: 'app-structure-search',
  standalone: true,
  imports: [SearchPageComponent],
  template: `
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
  `
})
export class StructureSearchComponent implements OnInit {
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

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.titleKey = (this.route.snapshot.data['titleKey'] ?? 'structures.title') as MessageKey;
    const structureType = String(this.route.snapshot.data['structureType'] ?? 'ASL');
    const manageRoute = String(this.route.snapshot.data['manageRoute'] ?? '/structures/asl/manage');
    this.fixedParams = { structureType };
    this.createRoute = manageRoute;
    this.detailRouteBase = manageRoute;
  }
}
