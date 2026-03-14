import { Component } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { CrudField, CrudFolder, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina gestione utente allineata alla schermata di modifica ma raggiungibile con route dedicata.
 */
@Component({
  selector: 'app-users-manage',
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
      [hideActions]="true"
      [showCancel]="true"
      #crudPage
    />
  `
})
export class UsersManageComponent {
  constructor(private readonly authService: AuthService) {}

  titleKey = 'users.configure.title' as const;
  endpoint = 'users';
  moduleCode = 'USER';
  createFunctionCode = 'CREATE';
  initialFormModel = this.authService.getSelectedClient().trim().length > 0
    ? { clientId: this.authService.getSelectedClient().trim() }
    : {};

  fields: CrudField[] = [
    { key: 'username', labelKey: 'users.field.username', type: 'text', readonly: true, required: true },
    { key: 'email', labelKey: 'users.field.email', type: 'text', readonly: true, required: true }
  ];

  folders: CrudFolder[] = [
    {
      key: 'account',
      titleKey: 'users.folder.account',
      fields: [
        { key: 'username', labelKey: 'users.field.username', type: 'text', readonly: true, required: true },
        { key: 'email', labelKey: 'users.field.email', type: 'text', readonly: true, required: true }
      ]
    }
  ];
}
