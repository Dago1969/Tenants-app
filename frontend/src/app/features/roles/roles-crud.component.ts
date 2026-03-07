import { Component } from '@angular/core';
import { CrudField, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina CRUD ruoli tenant.
 */
@Component({
  selector: 'app-roles-crud',
  standalone: true,
  imports: [CrudPageComponent],
  template: `<app-crud-page [titleKey]="titleKey" [endpoint]="endpoint" [fields]="fields" />`
})
export class RolesCrudComponent {
  titleKey = 'roles.title' as const;
  endpoint = 'roles';
  fields: CrudField[] = [
    { key: 'id', labelKey: 'roles.field.id', type: 'text' },
    { key: 'description', labelKey: 'roles.field.description', type: 'text' }
  ];
}
