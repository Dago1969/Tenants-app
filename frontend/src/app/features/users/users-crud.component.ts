import { Component } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { TenantPointerApiService } from '../../core/tenant-pointer-api.service';
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
      [createEndpoint]="createEndpoint"
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
  constructor(
    private readonly authService: AuthService,
    private readonly tenantPointerApi: TenantPointerApiService
  ) {
    const selectedClient = this.authService.getSelectedClient().trim();
    if (selectedClient.length === 0) {
      return;
    }

    this.tenantPointerApi.getTenantPointerByClientCode(selectedClient).subscribe({
      next: (tenantPointer) => {
        if (!tenantPointer?.id) {
          return;
        }

        this.initialFormModel = {
          ...this.initialFormModel,
          tenantId: tenantPointer.id
        };
      }
    });
  }

  titleKey = 'users.title' as const;
  endpoint = 'users';
  createEndpoint = 'users/onboard';
  moduleCode = 'USER';
  createFunctionCode = 'CREATE';
  initialFormModel: Record<string, unknown> = this.authService.getSelectedClient().trim().length > 0
    ? { clientId: this.authService.getSelectedClient().trim(), enabled: true }
    : { enabled: true };

  fields: CrudField[] = [
    { key: 'clientId', labelKey: 'users.field.clientId', type: 'text', hidden: true },
    { key: 'tenantId', labelKey: 'projects.field.tenantId', type: 'number', hidden: true, createOnly: true },
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
      optionsEndpoint: 'projects?tenant={clientId}',
      optionValueKey: 'id',
      optionLabelKey: 'code',
      required: true
    },
    {
      key: 'roleId',
      labelKey: 'users.field.roleId',
      type: 'select',
      optionsEndpoint: 'roles/proxy',
      optionValueKey: 'id',
      optionLabelKey: 'description',
      includeValueInOptionLabel: true,
      required: true
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
          optionsEndpoint: 'projects?tenant={clientId}',
          optionValueKey: 'id',
          optionLabelKey: 'code',
          required: true
        },
        {
          key: 'roleId',
          labelKey: 'users.field.roleId',
          type: 'select',
          optionsEndpoint: 'roles/proxy',
          optionValueKey: 'id',
          optionLabelKey: 'description',
          includeValueInOptionLabel: true,
          required: true
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
