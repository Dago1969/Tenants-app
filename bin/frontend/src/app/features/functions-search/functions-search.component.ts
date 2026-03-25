import { Component } from '@angular/core';
import { SearchField, SearchPageComponent } from '../../shared/search-page.component';

/**
 * Pagina ricerca funzioni con filtri base.
 */
@Component({
  selector: 'app-functions-search',
  standalone: true,
  imports: [SearchPageComponent],
  template: `
    <app-search-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [filters]="filters"
      [resultColumns]="resultColumns"
      [moduleCode]="moduleCode"
      [createFunctionCode]="createFunctionCode"
    />
  `
})
export class FunctionsSearchComponent {
  titleKey = 'functions.search.title' as const;
  endpoint = 'functions';
  moduleCode = 'FUNCTION';
  createFunctionCode = 'CREATE';

  filters: SearchField[] = [
    { key: 'code', labelKey: 'functions.field.code', type: 'text' },
    { key: 'name', labelKey: 'functions.field.name', type: 'text' }
  ];

  resultColumns: SearchField[] = [
    { key: 'code', labelKey: 'functions.field.code', type: 'text' },
    { key: 'name', labelKey: 'functions.field.name', type: 'text' }
  ];
}
