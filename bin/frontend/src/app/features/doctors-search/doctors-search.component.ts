import { Component } from '@angular/core';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';

/**
 * Pagina ricerca dottori con filtri base.
 */
@Component({
  selector: 'app-doctors-search',
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
export class DoctorsSearchComponent {
  titleKey = 'doctors.search.title' as const;
  endpoint = 'doctors';

  filters: SearchField[] = [
    { key: 'doctorFlyerId', labelKey: 'doctors.field.doctorFlyerId', type: 'text' },
    { key: 'fullName', labelKey: 'doctors.field.fullName', type: 'text' },
    { key: 'email', labelKey: 'doctors.field.email', type: 'text' },
    { key: 'specialization', labelKey: 'doctors.field.specialization', type: 'text' },
    { key: 'structureId', labelKey: 'doctors.field.structureId', type: 'number' }
  ];

  resultColumns: SearchField[] = [
    { key: 'doctorFlyerId', labelKey: 'doctors.field.doctorFlyerId', type: 'text' },
    { key: 'fullName', labelKey: 'doctors.field.fullName', type: 'text' },
    { key: 'email', labelKey: 'doctors.field.email', type: 'text' },
    { key: 'specialization', labelKey: 'doctors.field.specialization', type: 'text' },
    { key: 'structureId', labelKey: 'doctors.field.structureId', type: 'number' }
  ];
}
