import { Component } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { t } from '../i18n/messages';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="main-header tenants-main-header">
      <img src="assets/quicare-logo.png" alt="QuiCare Logo" class="main-logo tenants-main-logo" />
      <button class="btn btn-danger tenants-header-logout" type="button" (click)="logout()">
        {{ translate('common.logout') }}
      </button>
    </header>
  `
})
export class HeaderComponent {
  constructor(private readonly authService: AuthService) {}

  translate(key: string): string {
    return t(key);
  }

  logout(): void {
    this.authService.logout();
  }
}
