import { Component } from '@angular/core';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';

/**
 * Pagina ricerca moduli con filtri base.
 */
@Component({
  selector: 'app-modules-search',
  standalone: true,
  imports: [SearchPageComponent],
  template: `
    <app-search-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [filters]="filters"
      [resultColumns]="resultColumns"
    />
  `
})
export class ModulesSearchComponent {
  titleKey = 'modules.search.title' as const;
  endpoint = 'modules';

  filters: SearchField[] = [
    { key: 'code', labelKey: 'modules.field.code', type: 'text' },
    { key: 'name', labelKey: 'modules.field.name', type: 'text' }
  ];

  resultColumns: SearchField[] = [
    { key: 'code', labelKey: 'modules.field.code', type: 'text' },
    { key: 'name', labelKey: 'modules.field.name', type: 'text' }
  ];
}
