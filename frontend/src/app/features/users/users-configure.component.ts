import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { ProjectApiService, ProjectDto } from '../../core/project-api.service';
import { CrudField, CrudFolder, CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina di configurazione utenti tenant (duplicato da edit).
 */

@Component({
  selector: 'app-users-configure',
  standalone: true,
  imports: [CrudPageComponent, CommonModule],
  templateUrl: './users-configure.component.html',
  styleUrls: ['./users-configure.component.css']
})
export class UsersConfigureComponent implements OnInit {
  projects: ProjectDto[] = [];
  loadingProjects = false;
  errorProjects = '';

  constructor(
    private readonly authService: AuthService,
    private readonly projectApi: ProjectApiService
  ) {}


ngOnInit(): void {
  console.log('[UsersConfigureComponent] ngOnInit');
  const tenantCode = this.authService.getSelectedClient();
  console.log('[UsersConfigureComponent] tenantCode:', tenantCode);
  if (!tenantCode) {
    this.errorProjects = 'Tenant non selezionato';
    return;
  }
  this.loadingProjects = true;
  this.projectApi.getProjectsByTenant(tenantCode).subscribe({
    next: (projects) => {
      this.projects = projects;
      this.loadingProjects = false;
    },
    error: (err) => {
      this.errorProjects = 'Errore nel caricamento progetti';
      this.loadingProjects = false;
    }
  });
  }

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
