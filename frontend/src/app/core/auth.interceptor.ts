import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Interceptor che propaga Authorization Bearer con token condiviso.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const selectedRole = authService.getSelectedRole();
  const selectedClient = authService.getSelectedClient();

  if (!token) {
    return next(req);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`
  };

  if (selectedRole) {
    headers['X-Selected-Role'] = selectedRole;
  }
  if (selectedClient) {
    headers['X-Selected-Client'] = selectedClient;
  }

  return next(
    req.clone({
      setHeaders: headers
    })
  );
};
