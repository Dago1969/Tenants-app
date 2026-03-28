import { Component } from '@angular/core';
import { CrudField, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina CRUD del catalogo tipi struttura persistiti a database.
 */
@Component({
  selector: 'app-structure-types-crud',
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
export class StructureTypesCrudComponent {
  titleKey = 'structures.types.title' as const;
  endpoint = 'structure-types';
  entityKey = 'code';
  moduleCode = 'STRUCTURE';
  createFunctionCode = 'CREATE';

  fields: CrudField[] = [
    { key: 'code', labelKey: 'structures.types.field.code', type: 'text', lockOnEdit: true },
    { key: 'description', labelKey: 'structures.types.field.description', type: 'text' },
    { key: 'functionDescription', labelKey: 'structures.types.field.functionDescription', type: 'text' },
    {
      key: 'parentTypeCode',
      labelKey: 'structures.types.field.parentTypeCode',
      type: 'select',
      optionsEndpoint: 'structure-types',
      optionValueKey: 'code',
      optionLabelKey: 'description'
    },
    { key: 'displayOrder', labelKey: 'structures.types.field.displayOrder', type: 'number' }
  ];
}
