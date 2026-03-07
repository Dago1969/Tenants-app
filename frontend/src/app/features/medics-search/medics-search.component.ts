import { Component } from '@angular/core';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';

/**
 * Pagina ricerca medici con filtri base.
 */
@Component({
  selector: 'app-medics-search',
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
export class MedicsSearchComponent {
  titleKey = 'medics.search.title' as const;
  endpoint = 'medics';

  filters: SearchField[] = [
    { key: 'doctorFlyerId', labelKey: 'medics.field.doctorFlyerId', type: 'text' },
    { key: 'fullName', labelKey: 'medics.field.fullName', type: 'text' },
    { key: 'email', labelKey: 'medics.field.email', type: 'text' },
    { key: 'specialization', labelKey: 'medics.field.specialization', type: 'text' },
    { key: 'structureId', labelKey: 'medics.field.structureId', type: 'number' }
  ];

  resultColumns: SearchField[] = [
    { key: 'doctorFlyerId', labelKey: 'medics.field.doctorFlyerId', type: 'text' },
    { key: 'fullName', labelKey: 'medics.field.fullName', type: 'text' },
    { key: 'email', labelKey: 'medics.field.email', type: 'text' },
    { key: 'specialization', labelKey: 'medics.field.specialization', type: 'text' },
    { key: 'structureId', labelKey: 'medics.field.structureId', type: 'number' }
  ];
}
