import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// URL della pagina di login di QTMDashboard
const QTMDASHBOARD_LOGIN_URL = 'http://localhost:4200/login';
/**
 * Guard minimale: consente accesso CRUD solo se token presente.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUrl = new URL(window.location.href);
  const incomingToken = currentUrl.searchParams.get('token');

  if (incomingToken) {
    authService.setToken(incomingToken);
    currentUrl.searchParams.delete('token');
    window.history.replaceState({}, document.title, currentUrl.toString());
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect diretto alla login di QTMDashboard se token assente/scaduto
  window.location.href = QTMDASHBOARD_LOGIN_URL;
  return false;
};
