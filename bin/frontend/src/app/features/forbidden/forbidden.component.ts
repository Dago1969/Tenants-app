import { Component } from '@angular/core';
import { MessageKey, t } from '../../i18n/messages';

/**
 * Pagina forbidden per accesso negato a moduli hidden.
 */
@Component({
  selector: 'app-forbidden',
  standalone: true,
  template: `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#f3f4f6;">
      <div style="background:#fff;padding:48px 32px;border-radius:16px;box-shadow:0 4px 24px #00000022;max-width:420px;text-align:center;">
        <svg width="64" height="64" fill="none" viewBox="0 0 24 24" style="margin-bottom:16px;"><circle cx="12" cy="12" r="10" fill="#f87171"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
        <h1 style="color:#b91c1c;font-size:2rem;margin-bottom:8px;">{{ translate('forbidden.title') }}</h1>
        <p style="color:#374151;font-size:1.1rem;margin-bottom:24px;">{{ translate('forbidden.message') }}</p>
        <a href="/dashboard" style="background:#111827;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;">{{ translate('forbidden.backToDashboard') }}</a>
      </div>
    </div>
  `,
  styleUrls: []
})
export class ForbiddenComponent {
  translate(key: MessageKey): string {
    return t(key);
  }
}
