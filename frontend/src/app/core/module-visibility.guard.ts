import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

/**
 * Guard che blocca l'accesso alle route dei moduli hidden per il ruolo selezionato.
 * Se il modulo è hidden, effettua redirect a /not-authorized.
 */
export function moduleVisibilityGuard(moduleCode: string): CanActivateFn {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const http = inject(HttpClient);
    const selectedRole = authService.getSelectedRole();
    console.log('[moduleVisibilityGuard] INGRESSO GUARD. Ruolo selezionato:', selectedRole, 'Modulo richiesto:', moduleCode);
    if (!selectedRole) {
      console.warn('[moduleVisibilityGuard] Nessun ruolo selezionato. Accesso NEGATO. Redirect a /forbidden');
      return router.createUrlTree(['/forbidden']);
    }
    try {
      const matrix = await firstValueFrom(
        http.get<any>(`${environment.apiBaseUrl}/authorizations/roles/${selectedRole}`)
      );
      const hiddenModules = new Set(
        (matrix.modules ?? [])
          .filter((m: any) => m.moduleAuthorization === 'deny')
          .map((m: any) => m.moduleCode)
      );
      console.log('[moduleVisibilityGuard] Hidden modules per ruolo', selectedRole, ':', Array.from(hiddenModules));
      if (hiddenModules.has(moduleCode)) {
        console.warn('[moduleVisibilityGuard] Modulo', moduleCode, 'è hidden per ruolo', selectedRole, '. Accesso NEGATO. Redirect a /forbidden');
        return router.createUrlTree(['/forbidden']);
      }
      console.log('[moduleVisibilityGuard] Accesso CONSENTITO al modulo', moduleCode, 'per ruolo', selectedRole);
      return true;
    } catch (err) {
      console.error('[moduleVisibilityGuard] Errore durante il controllo moduli. Accesso NEGATO. Redirect a /forbidden', err);
      return router.createUrlTree(['/forbidden']);
    }
  };
}
