import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OtpApiService } from '../../core/otp-api.service';
import { MessageKey, t } from '../../i18n/messages';
import { NotificationService } from '../../shared/notification.service';

/**
 * Pagina di avvio del flusso OTP demo: raccoglie numero di telefono e canale, invia l'OTP e apre la pagina di verifica.
 */
@Component({
  selector: 'app-otp-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="otp-page">
      <div class="card otp-card">
        <div class="otp-header">
          <h2>{{ translate('otp.request.title') }}</h2>
          <p>{{ translate('otp.request.subtitle') }}</p>
        </div>

        <form class="otp-form" (ngSubmit)="sendOtp()">
          <div class="otp-field-row">
            <div class="otp-field">
              <span class="otp-label">{{ translate('otp.request.phoneLabel') }}</span>
              <input
                type="text"
                name="phoneNumber"
                [(ngModel)]="phoneNumber"
                [placeholder]="translate('otp.request.phonePlaceholder')"
                autocomplete="tel"
              />
            </div>

            <div class="otp-field">
              <span class="otp-label">{{ translate('otp.request.channelLabel') }}</span>
              <select name="channel" [(ngModel)]="channel">
                <option *ngFor="let option of channelOptions" [ngValue]="option.value">
                  {{ translate(option.labelKey) }}
                </option>
              </select>
            </div>
          </div>

          <p>{{ translate('otp.request.hint') }}</p>

          <div class="otp-actions">
            <button class="manage-add-button" type="submit" [disabled]="loading">
              {{ translate('otp.request.sendAction') }}
            </button>
          </div>
        </form>
      </div>
    </section>
  `
})
export class OtpRequestComponent {
  phoneNumber = '';
  channel = 'sms';
  loading = false;

  readonly channelOptions = [
    { value: 'sms', labelKey: 'users.otpChannel.sms' },
    { value: 'whatsapp', labelKey: 'users.otpChannel.whatsapp' },
    { value: 'call', labelKey: 'users.otpChannel.call' }
  ] as const;

  constructor(
    private readonly otpApiService: OtpApiService,
    private readonly notificationService: NotificationService,
    private readonly router: Router
  ) {}

  translate(key: MessageKey): string {
    return t(key);
  }

  sendOtp(): void {
    const normalizedPhone = this.phoneNumber.trim();
    if (!normalizedPhone) {
      this.notificationService.showError(this.translate('otp.request.validation.phoneRequired'));
      return;
    }

    this.loading = true;
    this.otpApiService.sendPhoneOtp(normalizedPhone, this.channel).subscribe({
      next: () => {
        this.otpApiService.savePendingOtpContext(normalizedPhone, this.channel);
        this.notificationService.showSuccess(this.translate('otp.request.success.sent'));
        void this.router.navigate(['/otp/verify']);
      },
      error: () => {
        this.notificationService.showError(this.translate('otp.request.error.send'));
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}