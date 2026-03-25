import { Component } from '@angular/core';
import { CrudField, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina CRUD funzioni tenant.
 */
@Component({
  selector: 'app-functions-crud',
  standalone: true,
  imports: [CrudPageComponent],
  template: `
    <app-crud-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [fields]="fields"
      [entityKey]="entityKey"
      [moduleCode]="moduleCode"
      [createFunctionCode]="createFunctionCode"
    />
  `
})
export class FunctionsCrudComponent {
  titleKey = 'functions.title' as const;
  endpoint = 'functions';
  entityKey = 'code';
  moduleCode = 'FUNCTION';
  createFunctionCode = 'CREATE';
  fields: CrudField[] = [
    { key: 'code', labelKey: 'functions.field.code', type: 'text', lockOnEdit: true },
    { key: 'name', labelKey: 'functions.field.name', type: 'text' }
  ];
}
