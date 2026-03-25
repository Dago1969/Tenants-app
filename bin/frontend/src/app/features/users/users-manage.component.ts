import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { ProjectApiService, ProjectDto } from '../../core/project-api.service';
import { UserTenantProjectRelationApiService } from '../../core/user-tenant-project-relation-api.service';
import { ActivatedRoute } from '@angular/router';
import { UserApiService, UserDto } from '../../core/user-api.service';
import { t } from '../../i18n/messages';
import { CrudPageComponent } from '../../shared/crud-page.component';

/**
 * Pagina gestione utente allineata alla schermata di modifica ma raggiungibile con route dedicata.
 */
@Component({
  selector: 'app-users-manage',
  standalone: true,
  imports: [CommonModule, CrudPageComponent],
  template: `
    <app-crud-page
      [titleKey]="'users.configure.title'"
      [endpoint]="'users'"
      [initialFormModel]="{ id: user?.id }"
      [isEditMode]="true"
      [hideActions]="true"
    >
      <div class="crud-fields" style="max-width: 500px; margin-bottom: 2rem;">
        <div class="crud-field-row">
          <label class="crud-label" for="username">{{ t('users.field.username') }}</label>
          <input class="crud-input" id="username" type="text" [value]="user?.username" readonly />
        </div>
        <div class="crud-field-row">
          <label class="crud-label" for="email">{{ t('users.field.email') }}</label>
          <input class="crud-input" id="email" type="text" [value]="user?.email" readonly />
        </div>
      </div>
      <div class="projects-section" style="margin:2rem 0 0 0;">
        <div class="card progetti-card">
          <div class="card-header">
            <h2>Progetti</h2>
          </div>
         <div class="card-body" style="border: 2px solid red;">
  <div style="display: flex; gap: 2rem; background-color: #f0f0f0;">
    
    <div style="flex: 1; border: 1px solid blue;">
      <h2 style="color: black !important; display: block !important;">TITOLO TEST ATTIVI</h2>
      <ul>
        <li *ngFor="let project of allProjects">{{ project.code }}</li>
      </ul>
    </div>

    <div style="flex: 1; border: 1px solid green;">
      <h2 style="color: black !important; display: block !important;">TITOLO TEST ASSOCIATI</h2>
      <ul>
        <li *ngFor="let project of authorizedProjects">{{ project.code }}</li>
      </ul>
    </div>

  </div>
</div>
        </div>
      </div>
    </app-crud-page>
  `
})
export class UsersManageComponent implements OnInit {
  allProjects: ProjectDto[] = [];
  authorizedProjects: ProjectDto[] = [];
  user: UserDto | null = null;
  t = t;

  constructor(
    private readonly authService: AuthService,
    private readonly projectApi: ProjectApiService,
    private readonly userTenantProjectRelationApi: UserTenantProjectRelationApiService,
    private readonly userApi: UserApiService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.userApi.getUserById(userId).subscribe((user: UserDto) => {
        this.user = user;
        this.loadProjects(user.id);
      });
    }
  }

  private loadProjects(userId: number): void {
    const clientCode = this.authService.getSelectedClient();
    if (!clientCode) {
      return;
    }

    this.projectApi.getProjectsByTenant(clientCode).subscribe((projects) => {
      this.allProjects = projects;
    });

    this.userTenantProjectRelationApi.getRelationsByUserAndTenant(userId, clientCode).subscribe((relations) => {
      const projectIds = new Set(relations.map(r => r.projectId));
      this.authorizedProjects = this.allProjects.filter(p => projectIds.has(p.id));
    });
  }

  goBack() {
    window.history.back();
  }
}

