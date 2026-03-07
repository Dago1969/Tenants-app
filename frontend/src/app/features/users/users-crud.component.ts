import { Component } from '@angular/core';
import { CrudField, CrudFolder, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina CRUD utenti tenant.
 */
@Component({
  selector: 'app-users-crud',
  standalone: true,
  imports: [CrudPageComponent],
  template: `<app-crud-page [titleKey]="titleKey" [endpoint]="endpoint" [fields]="fields" [folders]="folders" />`
})
export class UsersCrudComponent {
  titleKey = 'users.title' as const;
  endpoint = 'users';

  fields: CrudField[] = [
    { key: 'username', labelKey: 'users.field.username', type: 'text' },
    { key: 'enabled', labelKey: 'users.field.enabled', type: 'checkbox' },
    { key: 'roleId', labelKey: 'users.field.roleId', type: 'text' },
    { key: 'structureId', labelKey: 'users.field.structureId', type: 'number' }
  ];

  folders: CrudFolder[] = [
    {
      key: 'account',
      titleKey: 'users.folder.account',
      fields: [
        { key: 'username', labelKey: 'users.field.username', type: 'text' },
        { key: 'enabled', labelKey: 'users.field.enabled', type: 'checkbox' },
        { key: 'roleId', labelKey: 'users.field.roleId', type: 'text' },
        { key: 'structureId', labelKey: 'users.field.structureId', type: 'number' }
      ]
    }
  ];
}
