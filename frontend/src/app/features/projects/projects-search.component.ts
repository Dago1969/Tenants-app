// Componente di ricerca Progetti, simile agli altri moduli di gestione
import { Component } from '@angular/core';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';

/**
 * Pagina ricerca progetti con filtri base.
 */
@Component({
  selector: 'app-projects-search',
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
    />
  `
})
export class ProjectsSearchComponent {
  titleKey = 'projects.search.title' as const;
  endpoint = 'projects';

  createRoute = '/projects/new';
  detailRouteBase = '/projects';

  filters: SearchField[] = [
    { key: 'code', labelKey: 'projects.field.code', type: 'text' },
    { key: 'descrizione', labelKey: 'projects.field.descrizione', type: 'text' }
  ];

  resultColumns: SearchField[] = [
    { key: 'code', labelKey: 'projects.field.code', type: 'text' },
    { key: 'descrizione', labelKey: 'projects.field.descrizione', type: 'text' },
    { key: 'dataInizio', labelKey: 'projects.field.dataInizio', type: 'text' },
    { key: 'dataFine', labelKey: 'projects.field.dataFine', type: 'text' }
  ];
}
