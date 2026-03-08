import { Component } from '@angular/core';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';

/**
 * Pagina di ricerca del catalogo tipi struttura con accesso al form CRUD.
 */
@Component({
  selector: 'app-structure-types-search',
  standalone: true,
  imports: [SearchPageComponent],
  template: `
    <app-search-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [filters]="filters"
      [resultColumns]="resultColumns"
      [createRoute]="createRoute"
      [detailRouteBase]="detailRouteBase"
      [resultIdKey]="resultIdKey"
      [resultIdLabelKey]="resultIdLabelKey"
      [moduleCode]="moduleCode"
      [createFunctionCode]="createFunctionCode"
      [autoSearch]="true"
      [showViewAction]="false"
    />
  `
})
export class StructureTypesSearchComponent {
  titleKey = 'structures.types.search.title' as const;
  endpoint = 'structure-types';
  createRoute = '/structure-types/manage';
  detailRouteBase = '/structure-types/manage';
  resultIdKey = 'code';
  resultIdLabelKey = 'structures.types.field.code' as const;
  moduleCode = 'STRUCTURE';
  createFunctionCode = 'CREATE';

  filters: SearchField[] = [
    { key: 'code', labelKey: 'structures.types.field.code', type: 'text' },
    { key: 'description', labelKey: 'structures.types.field.description', type: 'text' }
  ];

  resultColumns: SearchField[] = [
    { key: 'description', labelKey: 'structures.types.field.description', type: 'text' },
    { key: 'parentTypeDescription', labelKey: 'structures.types.field.parentTypeCode', type: 'text' },
    { key: 'displayOrder', labelKey: 'structures.types.field.displayOrder', type: 'number' }
  ];
}
