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
      [fixedParams]="fixedParams"
    />
  `
})
export class HospitalSearchComponent {
  titleKey = 'hospital.search.title' as const;
  endpoint = 'hospitals';
  fixedParams = { status: 1 };

  filters: SearchField[] = [
    { key: 'code', labelKey: 'hospital.field.code', type: 'text' },
    { key: 'name', labelKey: 'hospital.field.name', type: 'text' },
    { key: 'city', labelKey: 'hospital.field.city', type: 'text' },
    { key: 'region', labelKey: 'hospital.field.region', type: 'text' },
    {
      key: 'status',
      labelKey: 'hospital.field.status',
      type: 'select',
      options: [
        { value: '1', label: 'status.1' },
        { value: '0', label: 'status.0' },
        { value: '2', label: 'status.2' }
      ]
    }
  ];

  resultColumns: SearchField[] = [
    { key: 'code', labelKey: 'hospital.field.code', type: 'text' },
    { key: 'name', labelKey: 'hospital.field.name', type: 'text' },
    { key: 'city', labelKey: 'hospital.field.city', type: 'text' },
    { key: 'region', labelKey: 'hospital.field.region', type: 'text' },
    { key: 'status', labelKey: 'hospital.field.status', type: 'text' }
  ];
}
