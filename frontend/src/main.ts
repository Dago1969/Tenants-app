import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { authInterceptor } from './app/core/auth.interceptor';

/**
 * Bootstrap Angular dell'app tenants con router e interceptor JWT.
 */
function ensureIntlTelInputStylesheet(): void {
  if (document.querySelector('link[data-intl-tel-input="true"]')) {
    return;
  }

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = './assets/intl-tel-input/css/intlTelInput.css';
  stylesheet.setAttribute('data-intl-tel-input', 'true');
  document.head.appendChild(stylesheet);
}

ensureIntlTelInputStylesheet();

bootstrapApplication(AppComponent, {
  providers: [provideRouter(appRoutes), provideHttpClient(withInterceptors([authInterceptor]))]
}).catch((err: unknown) => console.error(err));
