import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { ProjectApiService, ProjectDto } from '../../core/project-api.service';
import { UserTenantProjectRelationApiService } from '../../core/user-tenant-project-relation-api.service';
import { TenantPointerApiService } from '../../core/tenant-pointer-api.service';
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
    private readonly userTenantProjectRelationApi: UserTenantProjectRelationApiService,
    private readonly tenantPointerApi: TenantPointerApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}
  isProjectAssociated(projectId: number): boolean {
    return this.associatedProjects.some(p => p.id === projectId);
  }

  associateProject(projectId: number): void {
    const tenantCode = this.authService.getSelectedClient();
    const userIdParam = this.route.snapshot.paramMap.get('id');
    const userId = userIdParam ? Number(userIdParam) : null;
    if (!userId || !tenantCode) {
      console.warn('[associateProject] userId o tenantCode mancante', { userId, tenantCode });
      return;
    }
    // Recupera il tenantId numerico dal backend
    this.tenantPointerApi.getTenantPointerByClientCode(tenantCode).subscribe({
      next: (tenantPointer) => {
        if (!tenantPointer || !tenantPointer.id) {
          console.error('[associateProject] tenantPointer non trovato per tenantCode', tenantCode);
          return;
        }
        const relation = {
          userId,
          tenantId: tenantPointer.id,
          projectId,
          superuser: false
        };
        console.log('[associateProject] DTO inviato:', relation);
        this.userTenantProjectRelationApi.addRelation(relation).subscribe({
          next: (res) => {
            console.log('[associateProject] Successo:', res);
            // Dopo associazione, redirect alla pagina di gestione utente per aggiornare tutto
            this.router.navigate(['/users/manage', userId]);
          },
          error: (err) => {
            console.error('[associateProject] Errore:', err);
          }
        });
      },
      error: (err) => {
        console.error('[associateProject] Errore recupero tenantPointer:', err);
      }
    });
  }


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
          this.tenantPointerApi.getTenantPointerByClientCode(tenantCode).subscribe({
            next: (tenantPointer) => {
              if (!tenantPointer || !tenantPointer.id) {
                this.errorAssociated = 'Tenant non trovato';
                this.loadingAssociated = false;
                return;
              }
              this.projectApi.getAssociatedProjectsByUser(userId, tenantPointer.id).subscribe({
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
            },
            error: (err) => {
              this.errorAssociated = 'Errore nel recupero tenant';
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
