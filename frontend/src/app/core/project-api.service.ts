import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProjectAdministratorDto {
  userId: number;
  roleId: string;
  username: string;
  email: string;
}

export interface ProjectDto {
  id?: number;
  code: string;
  descrizione: string;
  clientCode?: string;
  tenantId?: number;
  tenant?: string;
  logo?: string;
  footer?: string;
  emailSender?: string;
  dataInizio?: string;
  dataFine?: string;
  administrators?: ProjectAdministratorDto[];
  roleIds?: string[];
  enabledModuleCodes?: string[];
  enabled?: boolean;
  json_visit?: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Restituisce tutti i progetti attivi per il tenant corrente.
   */
  getProjectsByTenant(tenant: string): Observable<ProjectDto[]> {
    return this.http.get<ProjectDto[]>(`${this.baseUrl}/projects?tenant=${encodeURIComponent(tenant)}`);
  }

  getProjectById(id: number): Observable<ProjectDto> {
    return this.http.get<ProjectDto>(`${this.baseUrl}/projects/${id}`);
  }

  createProject(project: ProjectDto): Observable<ProjectDto> {
    return this.http.post<ProjectDto>(`${this.baseUrl}/projects`, project);
  }

  updateProject(id: number, project: ProjectDto): Observable<ProjectDto> {
    return this.http.put<ProjectDto>(`${this.baseUrl}/projects/${id}`, project);
  }

  /**
   * Restituisce i progetti associati a uno user tramite la tabella user_role_project.
   */
  getAssociatedProjectsByUser(userId: number, tenantId: number): Observable<{ projectId: number; projectCode: string }[]> {
    const url = this.baseUrl.replace(/\/tenants$/, '') + `/user-role-project/user/${userId}/tenant/${tenantId}`;
    return this.http.get<{ projectId: number; projectCode: string }[]>(url);
  }
}
