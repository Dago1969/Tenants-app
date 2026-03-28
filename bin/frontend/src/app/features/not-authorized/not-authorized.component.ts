import { Component } from '@angular/core';
import { MessageKey, t } from '../../i18n/messages';

/**
 * Pagina informativa quando manca token JWT condiviso.
 */
@Component({
  selector: 'app-not-authorized',
  standalone: true,
  template: `
    <div class="card">
      <h2>{{ translate('notAuthorized.title') }}</h2>
      <p>{{ translate('notAuthorized.message') }}</p>
    </div>
  `
})
export class NotAuthorizedComponent {
  translate(key: MessageKey): string {
    return t(key);
  }
}
