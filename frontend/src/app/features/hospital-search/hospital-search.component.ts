import { Component } from '@angular/core';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';

/**
 * Pagina ricerca ospedali con filtri base, stile patients/search.
 */
@Component({
  selector: 'app-hospital-search',
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
export class HospitalSearchComponent {
  titleKey = 'hospital.search.title' as const;
  endpoint = 'hospitals';

  filters: SearchField[] = [
    { key: 'code', labelKey: 'hospital.field.code', type: 'text' },
    { key: 'name', labelKey: 'hospital.field.name', type: 'text' },
    { key: 'city', labelKey: 'hospital.field.city', type: 'text' },
    { key: 'region', labelKey: 'hospital.field.region', type: 'text' },
    { key: 'active', labelKey: 'hospital.field.active', type: 'boolean' }
  ];

  resultColumns: SearchField[] = [
    { key: 'code', labelKey: 'hospital.field.code', type: 'text' },
    { key: 'name', labelKey: 'hospital.field.name', type: 'text' },
    { key: 'city', labelKey: 'hospital.field.city', type: 'text' },
    { key: 'region', labelKey: 'hospital.field.region', type: 'text' },
    { key: 'active', labelKey: 'hospital.field.active', type: 'boolean' }
  ];
}
