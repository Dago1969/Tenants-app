// ...existing code...
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const QTMDASHBOARD_LOGIN_URL = 'http://localhost:4200/login';

/**
 * Service auth per riuso token JWT condiviso con qtm-dashboard.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
    /**
     * Recupera i ruoli presenti nel token JWT (cerca in `realm_access.roles` e in `resource_access[*].roles`).
     */
    private getTokenRoles(): string[] {
      const payload = this.getTokenPayload();
      if (!payload) return [];

      const roles: string[] = [];
      try {
        const realmAccess = payload['realm_access'] as Record<string, unknown> | undefined;
        if (realmAccess && Array.isArray(realmAccess['roles'])) {
          roles.push(...(realmAccess['roles'] as string[]));
        }

        const resourceAccess = payload['resource_access'] as Record<string, unknown> | undefined;
        if (resourceAccess && typeof resourceAccess === 'object') {
          for (const client of Object.keys(resourceAccess)) {
            const clientEntry = resourceAccess[client] as Record<string, unknown> | undefined;
            if (clientEntry && Array.isArray(clientEntry['roles'])) {
              roles.push(...(clientEntry['roles'] as string[]));
            }
          }
        }
      } catch (e) {
        // ignore and return what we collected so far
      }

      return roles
        .filter((r): r is string => typeof r === 'string')
        .map(r => r.trim())
        .filter(r => r.length > 0);
    }

    /**
     * Restituisce true se l'utente autenticato (dal token) è SuperAdmin.
     */
    isSuperAdmin(): boolean {
      const roles = this.getTokenRoles();
      return roles.some(r => r.trim().toLowerCase().replace(/[^a-z0-9]/g, '').includes('superadmin'));
    }

    /**
     * Controllo generico se il ruolo selezionato contiene la stringa specificata (case-insensitive,
     * normalizzata rimuovendo caratteri non alfanumerici). Questo è relativo al ruolo *selezionato* nell'app,
     * non all'utente autenticato.
     */
    hasSelectedRoleContains(substring: string): boolean {
      const selected = this.getSelectedRole() ?? '';
      const normalized = selected.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      return normalized.includes((substring ?? '').toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
    getTokenPayload(): Record<string, unknown> | null {
      const token = this.getToken();
      if (!token) {
        return null;
      }

      try {
        const payload = this.decodeBase64Url(token.split('.')[1]);
        return JSON.parse(payload) as Record<string, unknown>;
      } catch {
        return null;
      }
    }

    getCurrentUserIdentifiers(): string[] {
      const payload = this.getTokenPayload();
      if (!payload) {
        return [];
      }

      const values = [
        payload['preferred_username'],
        payload['username'],
        payload['email'],
        payload['sub'],
        payload['userId'],
        payload['userid']
      ];

      return values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
    }

    /**
     * Estrae il nome completo (name) dal JWT.
     */
    getName(): string | null {
      const token = this.getToken();
      if (!token) return null;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.name || null;
      } catch {
        return null;
      }
    }

    /**
     * Estrae lo preferred_username dal JWT.
     */
    getPreferredUsername(): string | null {
      const token = this.getToken();
      if (!token) return null;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.preferred_username || null;
      } catch {
        return null;
      }
    }
  /**
   * Estrae il nome visualizzato dal token JWT:
   * - name (nome completo)
   * - preferred_username
   * - username
   * - sub (UUID, solo fallback)
   */
  getUsername(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.name || payload.preferred_username || payload.username || payload.sub || null;
    } catch {
      return null;
    }
  }
  private readonly tokenStorageKey = 'qtm_access_token';
  private readonly roleStorageKey = 'qtm_selected_role';
  private readonly clientStorageKey = 'qtm_selected_client';
  private readonly projectStorageKey = 'qtm_selected_project';
  private readonly selectedRoleSubject = new BehaviorSubject<string>(localStorage.getItem(this.roleStorageKey) ?? '');

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenStorageKey);

    if (!token) {
      return null;
    }

    if (this.isTokenExpired(token)) {
      localStorage.removeItem(this.tokenStorageKey);
      return null;
    }

    return token;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  logout(): void {
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.roleStorageKey);
    localStorage.removeItem(this.clientStorageKey);
    localStorage.removeItem(this.projectStorageKey);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('selectedProject');
      window.location.assign(QTMDASHBOARD_LOGIN_URL);
    }
    this.selectedRoleSubject.next('');
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenStorageKey, token);
  }

  setSelectedRole(role: string): void {
    localStorage.setItem(this.roleStorageKey, role);
    this.selectedRoleSubject.next(role);
  }

  getSelectedRole(): string {
    return localStorage.getItem(this.roleStorageKey) ?? '';
  }

  getSelectedRoleChanges(): Observable<string> {
    return this.selectedRoleSubject.asObservable();
  }

  setSelectedClient(client: string): void {
    localStorage.setItem(this.clientStorageKey, client);
  }

  setSelectedProject(project: string): void {
    const normalizedProject = project.trim();
    if (normalizedProject) {
      localStorage.setItem(this.projectStorageKey, normalizedProject);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('selectedProject', normalizedProject);
      }
      return;
    }

    localStorage.removeItem(this.projectStorageKey);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('selectedProject');
    }
  }

  getSelectedClient(): string {
    const value = localStorage.getItem(this.clientStorageKey) ?? '';
    // eslint-disable-next-line no-console
    console.log('[AuthService] getSelectedClient() ->', value);
    return value;
  }

  getSelectedProject(): string {
    const localProject = localStorage.getItem(this.projectStorageKey) ?? '';
    if (localProject.trim()) {
      return localProject;
    }

    if (typeof window === 'undefined') {
      return '';
    }

    const sessionProject = sessionStorage.getItem('selectedProject') ?? '';
    if (sessionProject.trim()) {
      localStorage.setItem(this.projectStorageKey, sessionProject.trim());
      return sessionProject.trim();
    }

    return '';
  }

  private isTokenExpired(token: string): boolean {
    const parts = token.split('.');

    if (parts.length < 2) {
      return true;
    }

    try {
      const payload = this.decodeBase64Url(parts[1]);
      const claims = JSON.parse(payload) as { exp?: number };

      if (typeof claims.exp !== 'number') {
        return true;
      }

      const nowInSeconds = Math.floor(Date.now() / 1000);
      return claims.exp <= nowInSeconds;
    } catch {
      return true;
    }
  }

  private decodeBase64Url(value: string): string {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const paddingLength = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(paddingLength);
    return atob(padded);
  }
}
