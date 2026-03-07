import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service auth per riuso token JWT condiviso con qtm-dashboard.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenStorageKey = 'qtm_access_token';
  private readonly roleStorageKey = 'qtm_selected_role';
  private readonly clientStorageKey = 'qtm_selected_client';
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

  getSelectedClient(): string {
    return localStorage.getItem(this.clientStorageKey) ?? '';
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
