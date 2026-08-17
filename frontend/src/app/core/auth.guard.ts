import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

/**
 * Guard minimale: consente accesso CRUD solo se token presente.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUrl = new URL(window.location.href);
  const incomingToken = currentUrl.searchParams.get('token');

  console.log('[authGuard] INGRESSO GUARD. URL:', currentUrl.toString(), 'incomingToken:', incomingToken);

  if (incomingToken) {
    console.log('[authGuard] Token trovato in query, lo imposto:', incomingToken);
    authService.setToken(incomingToken);
    currentUrl.searchParams.delete('token');
    window.history.replaceState({}, document.title, currentUrl.toString());
  }

  const isAuth = authService.isAuthenticated();
  console.log('[authGuard] isAuthenticated:', isAuth);
  if (isAuth) {
    console.log('[authGuard] Accesso CONSENTITO');
    return true;
  }

  // Redirect diretto alla login di QTMDashboard se token assente/scaduto
  console.warn('[authGuard] Accesso NEGATO. Redirect a login QTMDashboard:', environment.dashboardLoginUrl);
  window.location.href = environment.dashboardLoginUrl;
  return false;
};
