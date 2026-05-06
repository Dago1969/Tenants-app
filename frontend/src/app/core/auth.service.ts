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
      console.warn('[AuthService] getToken() -> token assente in localStorage');
      return null;
    }

    if (this.isTokenExpired(token)) {
      console.warn('[AuthService] getToken() -> token scaduto o non valido, rimosso da localStorage');
      localStorage.removeItem(this.tokenStorageKey);
      return null;
    }

    console.log('[AuthService] getToken() -> token valido trovato', this.describeToken(token));
    return token;
  }

  isAuthenticated(): boolean {
    const authenticated = this.getToken() !== null;
    console.log('[AuthService] isAuthenticated() ->', authenticated);
    return authenticated;
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
    console.log('[AuthService] setToken() -> token salvato', this.describeToken(token));
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
      console.warn('[AuthService] isTokenExpired() -> token malformato');
      return true;
    }

    try {
      const payload = this.decodeBase64Url(parts[1]);
      const claims = JSON.parse(payload) as { exp?: number };

      if (typeof claims.exp !== 'number') {
        console.warn('[AuthService] isTokenExpired() -> claim exp mancante', claims);
        return true;
      }

      const nowInSeconds = Math.floor(Date.now() / 1000);
      const expired = claims.exp <= nowInSeconds;
      console.log('[AuthService] isTokenExpired() ->', {
        expired,
        exp: claims.exp,
        nowInSeconds,
        preferred_username: (claims as { preferred_username?: string }).preferred_username,
        sub: (claims as { sub?: string }).sub
      });
      return expired;
    } catch (error) {
      console.warn('[AuthService] isTokenExpired() -> errore parsing token', error);
      return true;
    }
  }

  private describeToken(token: string): { prefix: string; length: number } {
    return {
      prefix: token.slice(0, 12),
      length: token.length
    };
  }

  private decodeBase64Url(value: string): string {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const paddingLength = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(paddingLength);
    return atob(padded);
  }
}
