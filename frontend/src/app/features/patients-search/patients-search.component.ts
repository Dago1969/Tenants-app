import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';

/**
 * Pagina ricerca pazienti con filtri base.
 */
@Component({
  selector: 'app-patients-search',
  standalone: true,
  imports: [SearchPageComponent, RouterOutlet],
  template: `
    <app-search-page
      #searchPage
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [fieldPermissionsEndpoint]="permissionsEndpoint"
      [moduleCode]="moduleCode"
      [createFunctionCode]="createFunctionCode"
      [detailRouteBase]="detailRouteBase"
      [filters]="filters"
      [resultColumns]="resultColumns"
      [autoSearch]="true"
    />

    <router-outlet (deactivate)="refreshAfterWizardClose()"></router-outlet>
  `
})
export class PatientsSearchComponent {
  @ViewChild('searchPage') private searchPage?: SearchPageComponent;

  titleKey = 'patients.search.title' as const;
  endpoint = 'patients';
  permissionsEndpoint = 'patients/permissions';
  moduleCode = 'PATIENT';
  createFunctionCode = 'CREATE';
  detailRouteBase = '/patients/search';

  refreshAfterWizardClose(): void {
    this.searchPage?.search(false);
  }

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