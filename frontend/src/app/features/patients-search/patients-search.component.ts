import { Component } from '@angular/core';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';

/**
 * Pagina ricerca pazienti con filtri base.
 */
@Component({
  selector: 'app-patients-search',
  standalone: true,
  imports: [SearchPageComponent],
  template: `
    <app-search-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [fieldPermissionsEndpoint]="permissionsEndpoint"
      [filters]="filters"
      [resultColumns]="resultColumns"
    />
  `
})
export class PatientsSearchComponent {
  titleKey = 'patients.search.title' as const;
  endpoint = 'patients';
  permissionsEndpoint = 'patients/permissions';

  filters: SearchField[] = [
    { key: 'assistedId', labelKey: 'patients.field.assistedId', type: 'text' },
    { key: 'firstName', labelKey: 'patients.field.firstName', type: 'text' },
    { key: 'lastName', labelKey: 'patients.field.lastName', type: 'text' },
    { key: 'email', labelKey: 'patients.field.email', type: 'text' },
    { key: 'fiscalCode', labelKey: 'patients.field.fiscalCode', type: 'text' },
    { key: 'structureId', labelKey: 'patients.field.structureId', type: 'number' }
  ];

  resultColumns: SearchField[] = [
    { key: 'assistedId', labelKey: 'patients.field.assistedId', type: 'text' },
    { key: 'firstName', labelKey: 'patients.field.firstName', type: 'text' },
    { key: 'lastName', labelKey: 'patients.field.lastName', type: 'text' },
    { key: 'email', labelKey: 'patients.field.email', type: 'text' },
    { key: 'fiscalCode', labelKey: 'patients.field.fiscalCode', type: 'text' },
    { key: 'structureId', labelKey: 'patients.field.structureId', type: 'number' }
  ];
}