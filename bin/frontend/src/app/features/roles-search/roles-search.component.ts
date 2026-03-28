import { Component } from '@angular/core';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';

/**
 * Pagina ricerca ruoli con filtri base e tabella risultati.
 */
@Component({
  selector: 'app-roles-search',
  standalone: true,
  imports: [SearchPageComponent],
  template: `
    <app-search-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [deleteCheckEndpoint]="deleteCheckEndpoint"
      [filters]="filters"
      [resultColumns]="resultColumns"
      [createRoute]="createRoute"
      [detailRouteBase]="detailRouteBase"
    />
  `
})
export class RolesSearchComponent {
  titleKey = 'roles.search.title' as const;
  endpoint = 'roles';
  deleteCheckEndpoint = 'roles/delete-check';
  createRoute = '/roles/new';
  detailRouteBase = '/roles';

  filters: SearchField[] = [
    { key: 'name', labelKey: 'roles.field.name', type: 'text' }
  ];

  resultColumns: SearchField[] = [
    { key: 'id', labelKey: 'roles.field.id', type: 'text' },
    { key: 'name', labelKey: 'roles.field.name', type: 'text' }
  ];
}
