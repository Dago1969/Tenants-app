import { Component } from '@angular/core';
import { AuthService } from '../../core/auth.service';
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
      [initialFormModel]="initialFormModel"
    />
  `
})
export class UsersCrudComponent {
  constructor(private readonly authService: AuthService) {}

  titleKey = 'users.title' as const;
  endpoint = 'users';
  moduleCode = 'USER';
  createFunctionCode = 'CREATE';
  initialFormModel = this.authService.getSelectedClient().trim().length > 0
    ? { clientId: this.authService.getSelectedClient().trim() }
    : {};

  fields: CrudField[] = [
    { key: 'clientId', labelKey: 'users.field.clientId', type: 'text', hidden: true },
    { key: 'username', labelKey: 'users.field.username', type: 'text', lockOnEdit: true, required: true },
    { key: 'email', labelKey: 'users.field.email', type: 'text', required: true },
    { key: 'enabled', labelKey: 'users.field.enabled', type: 'checkbox' },
    {
      key: 'projectId',
      labelKey: 'users.field.projectId',
      type: 'select',
      optionsEndpoint: 'projects', // endpoint REST per i progetti
      optionValueKey: 'id',
      optionLabelKey: 'code',
      // TODO: se serve mostrare anche descrizione, usare una funzione custom per label
    },
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
        { key: 'username', labelKey: 'users.field.username', type: 'text', lockOnEdit: true, required: true },
        { key: 'email', labelKey: 'users.field.email', type: 'text', required: true },
        { key: 'enabled', labelKey: 'users.field.enabled', type: 'checkbox' },
        {
          key: 'projectId',
          labelKey: 'users.field.projectId',
          type: 'select',
          optionsEndpoint: 'projects',
          optionValueKey: 'id',
          optionLabelKey: 'code',
        },
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
