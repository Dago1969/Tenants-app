import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';

/**
 * Pagina di ricerca dei piani terapeutici con wizard popup su route figlia.
 */
@Component({
  selector: 'app-therapeutic-plans-search',
  standalone: true,
  imports: [SearchPageComponent, RouterOutlet],
  template: `
    <app-search-page
      #searchPage
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [filters]="filters"
      [resultColumns]="resultColumns"
      [moduleCode]="moduleCode"
      [createFunctionCode]="createFunctionCode"
      [createRoute]="createRoute"
      [detailRouteBase]="detailRouteBase"
      [autoSearch]="true"
    />

    <router-outlet (deactivate)="refreshAfterWizardClose()"></router-outlet>
  `
})
export class TherapeuticPlansSearchComponent {
  @ViewChild('searchPage') private searchPage?: SearchPageComponent;

  titleKey = 'therapeuticPlan.search.title' as const;
  endpoint = 'therapeutic-plans';
  moduleCode = 'THERAPEUTIC_PLAN';
  createFunctionCode = 'CREATE';
  createRoute = '/therapeutic-plans/search/new';
  detailRouteBase = '/therapeutic-plans/search';

  filters: SearchField[] = [
    { key: 'patientName', labelKey: 'therapeuticPlan.field.patient', type: 'text' },
    { key: 'projectCode', labelKey: 'therapeuticPlan.field.projectCode', type: 'text' },
    { key: 'drugCode', labelKey: 'therapeuticPlan.field.drugCode', type: 'text' },
    {
      key: 'status',
      labelKey: 'therapeuticPlan.field.status',
      type: 'select',
      options: [
        { value: 'draft', label: 'status.draft' },
        { value: 'active', label: 'status.active' },
        { value: 'completed', label: 'status.completed' },
        { value: 'suspended', label: 'status.suspended' },
        { value: 'cancelled', label: 'status.cancelled' }
      ]
    }
  ];

  resultColumns: SearchField[] = [
    { key: 'patientDisplayName', labelKey: 'therapeuticPlan.field.patient', type: 'text' },
    { key: 'projectCode', labelKey: 'therapeuticPlan.field.projectCode', type: 'text' },
    { key: 'structureName', labelKey: 'therapeuticPlan.field.structure', type: 'text' },
    { key: 'nurseName', labelKey: 'therapeuticPlan.field.nurse', type: 'text' },
    { key: 'doctorName', labelKey: 'therapeuticPlan.field.doctor', type: 'text' },
    { key: 'drugCode', labelKey: 'therapeuticPlan.field.drugCode', type: 'text' },
    { key: 'status', labelKey: 'therapeuticPlan.field.status', type: 'text' },
    { key: 'startDate', labelKey: 'therapeuticPlan.field.startDate', type: 'text' },
    { key: 'endDate', labelKey: 'therapeuticPlan.field.endDate', type: 'text' }
  ];

  refreshAfterWizardClose(): void {
    this.searchPage?.search(false);
  }
}