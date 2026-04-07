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
      [wizardMode]="true"
      [popupMode]="true"
      [closeRoute]="'/users'"
      [closeOnSave]="true"
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
    { key: 'telefono', labelKey: 'users.field.telefono', type: 'text' },
    { key: 'codiceFiscale', labelKey: 'users.field.codiceFiscale', type: 'text' },
    { key: 'dataFineValiditaPassword', labelKey: 'users.field.dataFineValiditaPassword', type: 'date' },
    { key: 'canaleOtp', labelKey: 'users.field.canaleOtp', type: 'text' },
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
  ];

  folders: CrudFolder[] = [
    {
      key: 'account',
      titleKey: 'users.folder.account',
      descriptionKey: 'users.folder.account.description',
      fields: [
        { key: 'username', labelKey: 'users.field.username', type: 'text', lockOnEdit: true, required: true },
        { key: 'email', labelKey: 'users.field.email', type: 'text', required: true },
        { key: 'enabled', labelKey: 'users.field.enabled', type: 'checkbox' }
      ]
    },
    {
      key: 'contacts',
      titleKey: 'users.folder.contacts',
      descriptionKey: 'users.folder.contacts.description',
      fields: [
        { key: 'telefono', labelKey: 'users.field.telefono', type: 'text' },
        { key: 'codiceFiscale', labelKey: 'users.field.codiceFiscale', type: 'text' },
        { key: 'dataFineValiditaPassword', labelKey: 'users.field.dataFineValiditaPassword', type: 'date' },
        { key: 'canaleOtp', labelKey: 'users.field.canaleOtp', type: 'text' }
      ]
    },
    {
      key: 'assignments',
      titleKey: 'users.folder.assignments',
      descriptionKey: 'users.folder.assignments.description',
      fields: [
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
