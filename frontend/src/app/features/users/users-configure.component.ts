// ...existing code...
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { ProjectApiService, ProjectDto } from '../../core/project-api.service';
import { RoleApiService, RoleDto } from '../../core/role-api.service';
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
  projects: ProjectDto[] = [];
  loadingProjects = false;
  errorProjects = '';
  roles: RoleDto[] = [];
  userRoleProjects: UserRoleProjectView[] = [];
  loadingRoles = false;
  loadingAssociatedRoles = false;
  errorRoles = '';
  errorAssociatedRoles = '';
  selectedTenantId: number | null = null;
  selectedRoleId = '';
  selectedProject = '';

  /**
   * Restituisce il codice del progetto dato l'id, oppure l'id se non trovato
   */
  getProjectCodeById(projectId: number): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.code : String(projectId);
  }

  constructor(
    private readonly authService: AuthService,
    private readonly projectApi: ProjectApiService,
    private readonly roleApi: RoleApiService,
    private readonly userRoleProjectApi: UserRoleProjectApiService,
    private readonly tenantPointerApi: TenantPointerApiService,
    private readonly route: ActivatedRoute
  ) {}

  translate(key: MessageKey): string {
    return t(key);
  }

  canAssociateRoleProject(): boolean {
    return !!this.selectedRoleId && this.resolveSelectedProjectId() !== null && this.selectedTenantId !== null;
  }

  associateRoleProject(): void {
    const userIdParam = this.route.snapshot.paramMap.get('id');
    const userId = userIdParam ? Number(userIdParam) : null;
    const projectId = this.resolveSelectedProjectId();
    if (!userId || !this.selectedTenantId || !this.selectedRoleId || projectId === null) {
      console.warn('[associateRoleProject] Dati mancanti', {
        userId,
        tenantId: this.selectedTenantId,
        roleId: this.selectedRoleId,
        selectedProject: this.selectedProject,
        projectId
      });
      return;
    }

    if (this.userRoleProjects.some(relation => relation.tenantId === this.selectedTenantId
      && relation.roleId === this.selectedRoleId
      && relation.projectId === projectId)) {
      return;
    }

    this.userRoleProjectApi.addRelation({
      userId,
      tenantId: this.selectedTenantId,
      roleId: this.selectedRoleId,
      projectId
    }).subscribe({
      next: () => {
        this.refreshRolesData();
      },
      error: (err) => {
        console.error('[associateRoleProject] Errore:', err);
      }
    });
  }

  disassociateRoleProject(userId: number, tenantId: number, roleId: string, projectId: number): void {
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
    this.projectApi.getProjectsByTenant(tenantCode).subscribe({
      next: (projects) => {
        this.projects = projects;
        this.loadingProjects = false;
      },
      error: (err) => {
        this.errorProjects = this.translate('users.configure.projects.errors.loadAvailable');
        this.loadingProjects = false;
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
    this.roleApi.getProxyRoles().subscribe({
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
      .sort((left, right) => left.roleId.localeCompare(right.roleId) || left.projectId - right.projectId);
  }

  ngOnInit(): void {
    this.selectedProject = this.authService.getSelectedProject().trim();
    this.refreshConfigurationData();
  }

  getTenantCodeById(tenantId: number): string {
    const selectedTenantCode = this.authService.getSelectedClient().trim();
    if (this.selectedTenantId !== null && tenantId === this.selectedTenantId && selectedTenantCode) {
      return selectedTenantCode;
    }
    return String(tenantId);
  }

  private resolveSelectedProjectId(): number | null {
    const normalizedSelectedProject = this.selectedProject.trim();
    if (!normalizedSelectedProject) {
      return null;
    }

    const project = this.projects.find(currentProject =>
      String(currentProject.id) === normalizedSelectedProject
      || currentProject.code.trim().toLowerCase() === normalizedSelectedProject.toLowerCase());

    if (project) {
      return project.id ?? null;
    }

    const directProjectId = Number(normalizedSelectedProject);
    if (Number.isInteger(directProjectId)) {
      return directProjectId;
    }

    return null;
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
