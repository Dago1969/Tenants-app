import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { RoleApiService, RoleDto } from '../../core/role-api.service';
import { UserRoleProfileApiService, UserRoleProfileDto } from '../../core/user-role-profile-api.service';
import { TenantPointerApiService } from '../../core/tenant-pointer-api.service';
import { CrudField, CrudFolder, CrudPageComponent } from '../../shared/crud-page.component';
import { MessageKey, t } from '../../i18n/messages';

type UserRoleProfileView = UserRoleProfileDto & { roleName: string; roleDescription: string };

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
  roles: RoleDto[] = [];
  userRoleProfiles: UserRoleProfileView[] = [];
  loadingRoles = false;
  loadingAssociatedRoles = false;
  errorRoles = '';
  errorAssociatedRoles = '';
  selectedTenantId: number | null = null;
  selectedRoleId = '';
  profileId = '';

  constructor(
    private readonly authService: AuthService,
    private readonly roleApi: RoleApiService,
    private readonly userRoleProfileApi: UserRoleProfileApiService,
    private readonly tenantPointerApi: TenantPointerApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  translate(key: MessageKey): string {
    return t(key);
  }

  canAssociateRoleProfile(): boolean {
    return !!this.selectedRoleId && this.profileId.trim().length > 0 && this.selectedTenantId !== null;
  }

  associateRoleProfile(): void {
    const userIdParam = this.route.snapshot.paramMap.get('id');
    const userId = userIdParam ? Number(userIdParam) : null;
    const normalizedProfileId = this.profileId.trim();
    if (!userId || !this.selectedTenantId || !this.selectedRoleId || !normalizedProfileId) {
      console.warn('[associateRoleProfile] Dati mancanti', { userId, tenantId: this.selectedTenantId, roleId: this.selectedRoleId, profileId: normalizedProfileId });
      return;
    }

    if (this.userRoleProfiles.some(relation => relation.tenantId === this.selectedTenantId
      && relation.roleId === this.selectedRoleId
      && relation.profileId.toLowerCase() === normalizedProfileId.toLowerCase())) {
      return;
    }

    this.userRoleProfileApi.addRelation({
      userId,
      tenantId: this.selectedTenantId,
      roleId: this.selectedRoleId,
      profileId: normalizedProfileId
    }).subscribe({
      next: () => {
        this.profileId = '';
        this.refreshRolesData();
      },
      error: (err) => {
        console.error('[associateRoleProfile] Errore:', err);
      }
    });
  }

  disassociateRoleProfile(userId: number, tenantId: number, roleId: string, profileId: string): void {
    this.userRoleProfileApi.deleteRelation(userId, tenantId, roleId, profileId).subscribe({
      next: () => this.refreshRolesData(),
      error: (err) => {
        console.error('[disassociateRoleProfile] Errore:', err);
      }
    });
  }



  refreshConfigurationData(): void {
    this.refreshRolesData();
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
              this.userRoleProfileApi.getRelationsByUserAndTenant(userId, tenantPointer.id).subscribe({
                next: (relations) => {
                  this.userRoleProfiles = this.mapUserRoleProfiles(relations, roles);
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
          this.userRoleProfiles = [];
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

  private mapUserRoleProfiles(relations: UserRoleProfileDto[], roles: RoleDto[]): UserRoleProfileView[] {
    return relations
      .map(relation => {
        const role = roles.find(currentRole => currentRole.id === relation.roleId);
        return {
          ...relation,
          roleName: role?.name ?? relation.roleId,
          roleDescription: role?.description ?? ''
        };
      })
      .sort((left, right) => left.roleId.localeCompare(right.roleId) || left.profileId.localeCompare(right.profileId));
  }

  ngOnInit(): void {
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
