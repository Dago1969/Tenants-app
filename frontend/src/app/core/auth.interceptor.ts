import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

/**
 * Interceptor che propaga Authorization Bearer con token condiviso.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const selectedRole = authService.getSelectedRole();
  const selectedClient = authService.getSelectedClient();
  const selectedProject = authService.getSelectedProject();

  if (!token && req.url.startsWith(environment.apiBaseUrl)) {
    console.warn('[authInterceptor] Token assente. Redirect a login QTMDashboard:', environment.dashboardLoginUrl, 'requestUrl:', req.url);
    window.location.href = environment.dashboardLoginUrl;
    return throwError(() => new HttpErrorResponse({
      status: 401,
      statusText: 'Missing authentication token',
      url: req.url,
      error: 'Missing authentication token'
    }));
  }

  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (selectedRole) {
    headers['X-Selected-Role'] = selectedRole;
  }
  if (selectedClient) {
    headers['X-Selected-Client'] = selectedClient;
  }
  if (selectedProject) {
    headers['X-Selected-Project'] = selectedProject;
  }

  if (Object.keys(headers).length === 0) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: headers
    })
  );
};
