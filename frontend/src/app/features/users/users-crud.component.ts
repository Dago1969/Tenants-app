import { Component } from '@angular/core';
import { CrudField, CrudFolder, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina CRUD utenti tenant.
 */
@Component({
  selector: 'app-users-crud',
  standalone: true,
  imports: [CrudPageComponent],
  template: `
    <app-crud-page
      [titleKey]="titleKey"
      [endpoint]="endpoint"
      [fields]="fields"
      [folders]="folders"
      [moduleCode]="moduleCode"
      [createFunctionCode]="createFunctionCode"
    />
  `
})
export class UsersCrudComponent {
  titleKey = 'users.title' as const;
  endpoint = 'users';
  moduleCode = 'USER';
  createFunctionCode = 'CREATE';

  fields: CrudField[] = [
     { key: 'username', labelKey: 'users.field.username', type: 'text', lockOnEdit: true },
    { key: 'email', labelKey: 'users.field.email', type: 'text' },
     { key: 'enabled', labelKey: 'users.field.enabled', type: 'checkbox' },
    {
      key: 'roleId',
      labelKey: 'users.field.roleId',
      type: 'select',
      optionsEndpoint: 'roles',
      optionValueKey: 'id',
      optionLabelKey: 'description',
      includeValueInOptionLabel: true
    },
    {
      key: 'structureId',
      labelKey: 'users.field.structureId',
      type: 'select',
      optionsEndpoint: 'structures',
      optionValueKey: 'id',
      optionLabelKey: 'selectionLabel'
    }
  ];

  folders: CrudFolder[] = [
    {
      key: 'account',
      titleKey: 'users.folder.account',
      fields: [
          { key: 'username', labelKey: 'users.field.username', type: 'text', lockOnEdit: true },
          { key: 'email', labelKey: 'users.field.email', type: 'text' },
          { key: 'enabled', labelKey: 'users.field.enabled', type: 'checkbox' },
        {
          key: 'roleId',
          labelKey: 'users.field.roleId',
          type: 'select',
          optionsEndpoint: 'roles',
          optionValueKey: 'id',
          optionLabelKey: 'description',
          includeValueInOptionLabel: true
        },
        {
          key: 'structureId',
          labelKey: 'users.field.structureId',
          type: 'select',
          optionsEndpoint: 'structures',
          optionValueKey: 'id',
          optionLabelKey: 'selectionLabel'
        }
      ]
    }
  ];
}
