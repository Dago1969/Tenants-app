import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { ProjectApiService, ProjectDto } from '../../core/project-api.service';
import { RoleApiService, RoleDto } from '../../core/role-api.service';
import { UserTenantProjectRelationApiService } from '../../core/user-tenant-project-relation-api.service';
import { UserRoleProjectApiService, UserRoleProjectDto } from '../../core/user-role-project-api.service';
import { TenantPointerApiService } from '../../core/tenant-pointer-api.service';
import { CrudField, CrudFolder, CrudPageComponent } from '../../shared/crud-page.component';
import { MessageKey, t } from '../../i18n/messages';

type UserRoleProjectView = UserRoleProjectDto & { roleName: string; roleDescription: string };

/**
 * Pagina di configurazione utenti tenant (duplicato da edit).
 */

@Component({
  selector: 'app-users-configure',
  standalone: true,
  imports: [CrudPageComponent, CommonModule, FormsModule],
  templateUrl: './users-configure.component.html',
  styleUrls: ['./users-configure.component.css']
})
export class UsersConfigureComponent implements OnInit {

  readonly labelAssociate = t('users.configure.actions.associate');
  readonly labelDisassociate = t('users.configure.actions.disassociate');

    /**
     * Disassocia un progetto dall'utente (update ottimistico + refresh sincrono)
     */
    disassociateProject(projectId: number): void {
      const tenantCode = this.authService.getSelectedClient();
      const userIdParam = this.route.snapshot.paramMap.get('id');
      const userId = userIdParam ? Number(userIdParam) : null;
      if (!userId || !tenantCode) {
        console.warn('[disassociateProject] userId o tenantCode mancante', { userId, tenantCode });
        return;
      }
      // Aggiornamento ottimistico: rimuovi subito il progetto dagli associati e rimettilo tra i disponibili solo se non già presente
      const removedProject = this.associatedProjects.find(p => p.id === projectId);
      if (removedProject) {
        this.associatedProjects = this.associatedProjects.filter(p => p.id !== projectId);
        if (!this.projects.some(p => p.id === projectId)) {
          this.projects = [...this.projects, removedProject];
        }
      }
      // Chiamata backend per rimuovere l'associazione tramite proxy TENAPP
      this.tenantPointerApi.getTenantPointerByClientCode(tenantCode).subscribe({
        next: (tenantPointer) => {
          if (!tenantPointer || !tenantPointer.id) {
            console.error('[disassociateProject] tenantPointer non trovato per tenantCode', tenantCode);
            return;
          }
          this.userTenantProjectRelationApi.removeRelation(userId, tenantPointer.id, projectId).subscribe({
            next: () => {
              // Riallinea le liste dal backend
              this.refreshConfigurationData();
            },
            error: (err) => {
              console.error('[disassociateProject] Errore:', err);
            }
          });
        },
        error: (err) => {
          console.error('[disassociateProject] Errore recupero tenantPointer:', err);
        }
      });
    }
  projects: ProjectDto[] = [];
  associatedProjects: ProjectDto[] = [];
  loadingProjects = false;
  loadingAssociated = false;
  errorProjects = '';
  errorAssociated = '';
  roles: RoleDto[] = [];
  userRoleProjects: UserRoleProjectView[] = [];
  loadingRoles = false;
  loadingAssociatedRoles = false;
  errorRoles = '';
  errorAssociatedRoles = '';
  selectedTenantId: number | null = null;
  selectedRoleId = '';
  selectedProject = '';

  constructor(
    private readonly authService: AuthService,
    private readonly projectApi: ProjectApiService,
    private readonly roleApi: RoleApiService,
    private readonly userTenantProjectRelationApi: UserTenantProjectRelationApiService,
    private readonly userRoleProjectApi: UserRoleProjectApiService,
    private readonly tenantPointerApi: TenantPointerApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  translate(key: MessageKey): string {
    return t(key);
  }

  isProjectAssociated(projectId: number): boolean {
    return this.associatedProjects.some(p => p.id === projectId);
  }

  canAssociateRoleProject(): boolean {
    return !!this.selectedRoleId && this.selectedProject.trim().length > 0 && this.selectedTenantId !== null;
  }

  associateProject(projectId: number): void {
    const tenantCode = this.authService.getSelectedClient();
    const userIdParam = this.route.snapshot.paramMap.get('id');
    const userId = userIdParam ? Number(userIdParam) : null;
    if (!userId || !tenantCode) {
      console.warn('[associateProject] userId o tenantCode mancante', { userId, tenantCode });
      return;
    }
    // Aggiornamento ottimistico (asincrono): sposta subito il progetto tra gli associati
    const selectedProject = this.projects.find(p => p.id === projectId);
    if (selectedProject && !this.associatedProjects.some(p => p.id === projectId)) {
      this.associatedProjects = [...this.associatedProjects, selectedProject];
    }
    // Rimuovi subito dagli attivi
    this.projects = this.projects.filter(p => p.id !== projectId);

    // Poi chiama il backend normalmente e riallinea le liste al ritorno (sincrono)
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
            // Riallinea le liste dal backend
            this.refreshConfigurationData();
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

  associateRoleProject(): void {
    const userIdParam = this.route.snapshot.paramMap.get('id');
    const userId = userIdParam ? Number(userIdParam) : null;
    const normalizedProjectId = this.selectedProject.trim();
    if (!userId || !this.selectedTenantId || !this.selectedRoleId || !normalizedProjectId) {
      console.warn('[associateRoleProject] Dati mancanti', {
        userId,
        tenantId: this.selectedTenantId,
        roleId: this.selectedRoleId,
        projectId: normalizedProjectId
      });
      return;
    }

    if (this.userRoleProjects.some(relation => relation.tenantId === this.selectedTenantId
      && relation.roleId === this.selectedRoleId
      && relation.projectId.toLowerCase() === normalizedProjectId.toLowerCase())) {
      return;
    }

    this.userRoleProjectApi.addRelation({
      userId,
      tenantId: this.selectedTenantId,
      roleId: this.selectedRoleId,
      projectId: normalizedProjectId
    }).subscribe({
      next: () => {
        this.refreshRolesData();
      },
      error: (err) => {
        console.error('[associateRoleProject] Errore:', err);
      }
    });
  }

  disassociateRoleProject(userId: number, tenantId: number, roleId: string, projectId: string): void {
    this.userRoleProjectApi.deleteRelation(userId, tenantId, roleId, projectId).subscribe({
      next: () => this.refreshRolesData(),
      error: (err) => {
        console.error('[disassociateRoleProject] Errore:', err);
      }
    });
  }



  refreshConfigurationData(): void {
    this.refreshProjectsData();
    this.refreshRolesData();
  }

  private refreshProjectsData(): void {
    const tenantCode = this.authService.getSelectedClient();
    const userIdParam = this.route.snapshot.paramMap.get('id');
    const userId = userIdParam ? Number(userIdParam) : null;
    if (!tenantCode) {
      this.errorProjects = this.translate('users.configure.errors.tenantNotSelected');
      return;
    }
    this.loadingProjects = true;
    this.errorProjects = '';
    this.errorAssociated = '';
    this.projectApi.getProjectsByTenant(tenantCode).subscribe({
      next: (projects) => {
        this.projects = projects;
        this.loadingProjects = false;
        if (userId) {
          this.loadingAssociated = true;
          this.tenantPointerApi.getTenantPointerByClientCode(tenantCode).subscribe({
            next: (tenantPointer) => {
              if (!tenantPointer || !tenantPointer.id) {
                this.errorAssociated = this.translate('users.configure.errors.tenantNotFound');
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
                  this.errorAssociated = this.translate('users.configure.projects.errors.loadAssociated');
                  this.loadingAssociated = false;
                }
              });
            },
            error: (err) => {
              this.errorAssociated = this.translate('users.configure.errors.loadTenant');
              this.loadingAssociated = false;
            }
          });
        } else {
          this.errorAssociated = this.translate('users.configure.errors.userNotIdentified');
          this.associatedProjects = [];
          this.loadingAssociated = false;
        }
      },
      error: (err) => {
        this.errorProjects = this.translate('users.configure.projects.errors.loadAvailable');
        this.loadingProjects = false;
        this.loadingAssociated = false;
      }
    });
  }

  private refreshRolesData(): void {
    const tenantCode = this.authService.getSelectedClient();
    const userIdParam = this.route.snapshot.paramMap.get('id');
    const userId = userIdParam ? Number(userIdParam) : null;
    if (!tenantCode) {
      this.errorRoles = this.translate('users.configure.errors.tenantNotSelected');
      return;
    }
    this.loadingRoles = true;
    this.errorRoles = '';
    this.errorAssociatedRoles = '';
    this.roleApi.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.loadingRoles = false;
        if (userId) {
          this.loadingAssociatedRoles = true;
          this.tenantPointerApi.getTenantPointerByClientCode(tenantCode).subscribe({
            next: (tenantPointer) => {
              if (!tenantPointer || !tenantPointer.id) {
                this.errorAssociatedRoles = this.translate('users.configure.errors.tenantNotFound');
                this.loadingAssociatedRoles = false;
                return;
              }
              this.selectedTenantId = tenantPointer.id;
              this.userRoleProjectApi.getRelationsByUserAndTenant(userId, tenantPointer.id).subscribe({
                next: (relations) => {
                  this.userRoleProjects = this.mapUserRoleProjects(relations, roles);
                  this.loadingAssociatedRoles = false;
                },
                error: () => {
                  this.errorAssociatedRoles = this.translate('users.configure.roles.errors.loadAssociated');
                  this.loadingAssociatedRoles = false;
                }
              });
            },
            error: () => {
              this.selectedTenantId = null;
              this.errorAssociatedRoles = this.translate('users.configure.errors.loadTenant');
              this.loadingAssociatedRoles = false;
            }
          });
        } else {
          this.errorAssociatedRoles = this.translate('users.configure.errors.userNotIdentified');
          this.userRoleProjects = [];
          this.selectedTenantId = null;
          this.loadingAssociatedRoles = false;
        }
      },
      error: () => {
        this.errorRoles = this.translate('users.configure.roles.errors.loadAvailable');
        this.loadingRoles = false;
        this.loadingAssociatedRoles = false;
      }
    });
  }

  private mapUserRoleProjects(relations: UserRoleProjectDto[], roles: RoleDto[]): UserRoleProjectView[] {
    return relations
      .map(relation => {
        const role = roles.find(currentRole => currentRole.id === relation.roleId);
        return {
          ...relation,
          roleName: role?.name ?? relation.roleId,
          roleDescription: role?.description ?? ''
        };
      })
      .sort((left, right) => left.roleId.localeCompare(right.roleId) || left.projectId.localeCompare(right.projectId));
  }

  ngOnInit(): void {
    this.selectedProject = this.authService.getSelectedProject().trim();
    this.refreshConfigurationData();
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
