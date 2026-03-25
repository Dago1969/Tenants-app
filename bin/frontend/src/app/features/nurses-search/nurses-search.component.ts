import { Component } from '@angular/core';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';

/**
 * Pagina ricerca infermieri con filtri base.
 */
@Component({
  selector: 'app-nurses-search',
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
export class NursesSearchComponent {
  titleKey = 'nurses.search.title' as const;
  endpoint = 'nurses';

  filters: SearchField[] = [
    { key: 'nurseProjectId', labelKey: 'nurses.field.nurseProjectId', type: 'text' },
    { key: 'fullName', labelKey: 'nurses.field.fullName', type: 'text' },
    { key: 'email', labelKey: 'nurses.field.email', type: 'text' },
    { key: 'referenceProvider', labelKey: 'nurses.field.referenceProvider', type: 'text' },
    { key: 'enabled', labelKey: 'nurses.field.enabled', type: 'boolean' }
  ];

  resultColumns: SearchField[] = [
    { key: 'nurseProjectId', labelKey: 'nurses.field.nurseProjectId', type: 'text' },
    { key: 'fullName', labelKey: 'nurses.field.fullName', type: 'text' },
    { key: 'email', labelKey: 'nurses.field.email', type: 'text' },
    { key: 'referenceProvider', labelKey: 'nurses.field.referenceProvider', type: 'text' },
    { key: 'enabled', labelKey: 'nurses.field.enabled', type: 'boolean' }
  ];
}
