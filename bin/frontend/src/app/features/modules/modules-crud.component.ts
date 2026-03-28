import { Component } from '@angular/core';
import { CrudField, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina CRUD moduli tenant.
 */
@Component({
  selector: 'app-modules-crud',
  standalone: true,
  imports: [CrudPageComponent],
  template: `<app-crud-page [titleKey]="titleKey" [endpoint]="endpoint" [fields]="fields" [entityKey]="entityKey" />`
})
export class ModulesCrudComponent {
  titleKey = 'modules.title' as const;
  endpoint = 'modules';
  entityKey = 'code';
  fields: CrudField[] = [
    { key: 'code', labelKey: 'modules.field.code', type: 'text', lockOnEdit: true },
    { key: 'name', labelKey: 'modules.field.name', type: 'text' }
  ];
}
