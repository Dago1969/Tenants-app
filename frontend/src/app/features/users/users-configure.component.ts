import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  associatedProjects: ProjectDto[] = [];
  loadingProjects = false;
  loadingAssociated = false;
  errorProjects = '';
  errorAssociated = '';

  constructor(
    private readonly authService: AuthService,
    private readonly projectApi: ProjectApiService,
    private readonly route: ActivatedRoute
  ) {}


  ngOnInit(): void {
    console.log('[UsersConfigureComponent] ngOnInit');
    const tenantCode = this.authService.getSelectedClient();
    const userIdParam = this.route.snapshot.paramMap.get('id');
    const userId = userIdParam ? Number(userIdParam) : null;
    console.log('[UsersConfigureComponent] tenantCode:', tenantCode, 'userId:', userId);
    if (!tenantCode) {
      this.errorProjects = 'Tenant non selezionato';
      return;
    }
    this.loadingProjects = true;
    this.projectApi.getProjectsByTenant(tenantCode).subscribe({
      next: (projects) => {
        this.projects = projects;
        this.loadingProjects = false;
        // Carica i progetti associati solo se userId è disponibile
        if (userId) {
          this.loadingAssociated = true;
          this.projectApi.getAssociatedProjectsByUser(userId).subscribe({
            next: (relations) => {
              this.associatedProjects = relations
                .map(rel => projects.find(p => p.id === rel.projectId))
                .filter((p): p is ProjectDto => !!p);
              this.loadingAssociated = false;
            },
            error: (err) => {
              this.errorAssociated = 'Errore nel caricamento progetti associati';
              this.loadingAssociated = false;
            }
          });
        } else {
          this.errorAssociated = 'Utente non identificato';
          this.associatedProjects = [];
          this.loadingAssociated = false;
        }
      },
      error: (err) => {
        this.errorProjects = 'Errore nel caricamento progetti';
        this.loadingProjects = false;
        this.loadingAssociated = false;
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
