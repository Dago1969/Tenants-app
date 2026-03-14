import { Component } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { CrudField, CrudFolder, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina di configurazione utenti tenant (duplicato da edit).
 */
@Component({
  selector: 'app-users-configure',
  standalone: true,
  imports: [CrudPageComponent],
  templateUrl: './users-configure.component.html',
  styleUrls: ['./users-configure.component.css']
})
export class UsersConfigureComponent {
  constructor(private readonly authService: AuthService) {}

  goBack() {
    window.history.back();
  }

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
