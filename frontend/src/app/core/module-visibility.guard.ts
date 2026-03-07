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
    if (!selectedRole) {
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
      if (hiddenModules.has(moduleCode)) {
        return router.createUrlTree(['/forbidden']);
      }
      return true;
    } catch {
      return router.createUrlTree(['/forbidden']);
    }
  };
}
