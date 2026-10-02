import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

const QTMDASHBOARD_LOGIN_URL = 'http://localhost:4200/login';

/**
 * Interceptor che propaga Authorization Bearer con token condiviso.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const selectedRole = authService.getSelectedRole();
  const selectedClient = authService.getSelectedClient();

  if (!token && req.url.startsWith(environment.apiBaseUrl)) {
    window.location.href = QTMDASHBOARD_LOGIN_URL;
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

  if (Object.keys(headers).length === 0) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: headers
    })
  );
};
