import { Component, ViewChild } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';
import { t } from '../../i18n/messages';

/**
 * Pagina ricerca pazienti con filtri base.
 */
@Component({
  selector: 'app-patients-search',
  standalone: true,
  imports: [SearchPageComponent, RouterLink, RouterOutlet],
  template: `
    <ng-template #patientActions let-patient>
      <a
        class="icon-btn"
        [routerLink]="['/therapeutic-plans/search']"
        [queryParams]="{ patientId: patient.id }"
        [title]="therapeuticPlansLabel"
        [attr.aria-label]="therapeuticPlansLabel"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M9 5H5v16h14V5h-4M9 3h6v4H9zM8 11h8M8 15h8" />
        </svg>
      </a>
    </ng-template>
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
      [rowActionsTemplate]="patientActions"
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
  therapeuticPlansLabel = t('patients.action.therapeuticPlans');

  refreshAfterWizardClose(): void {
    this.searchPage?.search(false);
  }

  filters: SearchField[] = [
    { key: 'assistedId', labelKey: 'patients.field.assistedId', type: 'text' },
    { key: 'firstName', labelKey: 'patients.field.firstName', type: 'text' },
    { key: 'lastName', labelKey: 'patients.field.lastName', type: 'text' },
    { key: 'email', labelKey: 'patients.field.email', type: 'text' },
    { key: 'fiscalCode', labelKey: 'patients.field.fiscalCode', type: 'text' },
    { key: 'hospitalId', labelKey: 'patients.field.structureId', type: 'number' }
  ];

  resultColumns: SearchField[] = [
    { key: 'assistedId', labelKey: 'patients.field.assistedId', type: 'text' },
    { key: 'firstName', labelKey: 'patients.field.firstName', type: 'text' },
    { key: 'lastName', labelKey: 'patients.field.lastName', type: 'text' },
    { key: 'email', labelKey: 'patients.field.email', type: 'text' },
    { key: 'fiscalCode', labelKey: 'patients.field.fiscalCode', type: 'text' },
    { key: 'hospitalId', labelKey: 'patients.field.structureId', type: 'number' }
  ];
}