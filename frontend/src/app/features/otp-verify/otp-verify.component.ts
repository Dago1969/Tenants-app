import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OtpApiService, OtpVerificationResultResponse } from '../../core/otp-api.service';
import { MessageKey, t } from '../../i18n/messages';
import { NotificationService } from '../../shared/notification.service';

/**
 * Pagina di verifica del flusso OTP demo: consente inserimento codice, nuova richiesta OTP e ritorno alla pagina di partenza.
 */
@Component({
  selector: 'app-otp-verify',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="otp-page">
      <div class="card otp-card">
        <div class="otp-header">
          <h2>{{ translate('otp.verify.title') }}</h2>
          <p>{{ translate('otp.verify.subtitle') }}</p>
        </div>

        <div class="otp-summary" *ngIf="phoneNumber">
          <div class="otp-summary-item">
            <span class="otp-label">{{ translate('otp.verify.phoneLabel') }}</span>
            <input
              type="text"
              name="verificationPhoneNumber"
              [(ngModel)]="phoneNumber"
              (ngModelChange)="handlePhoneNumberChange()"
              [placeholder]="translate('otp.request.phonePlaceholder')"
              autocomplete="tel"
            />
          </div>
          <div class="otp-summary-item">
            <span class="otp-label">{{ translate('otp.verify.channelLabel') }}</span>
            <span class="otp-summary-value">{{ translate(channelLabelKey) }}</span>
          </div>
          <div class="otp-summary-item" *ngIf="verificationResult">
            <span class="otp-label">{{ translate('otp.verify.statusLabel') }}</span>
            <span class="otp-summary-value" [class.otp-status-approved]="verificationResult.approved" [class.otp-status-pending]="!verificationResult.approved">
              {{ verificationResult.status }}
            </span>
          </div>
        </div>

        <form class="otp-form" (ngSubmit)="checkOtp()">
          <div class="otp-field-row">
            <div class="otp-field">
              <span class="otp-label">{{ translate('otp.verify.codeLabel') }}</span>
              <input
                type="text"
                name="otpCode"
                [(ngModel)]="code"
                [placeholder]="translate('otp.verify.codePlaceholder')"
                autocomplete="one-time-code"
              />
            </div>
          </div>

          <div class="otp-actions">
            <button class="manage-add-button" type="submit" [disabled]="loading || !phoneNumber">
              {{ translate('otp.verify.validateAction') }}
            </button>
            <button class="manage-add-button-secondary" type="button" (click)="resendOtp()" [disabled]="loading || !phoneNumber">
              {{ translate('otp.verify.resendAction') }}
            </button>
            <a class="manage-add-button-secondary" [routerLink]="['/otp/request']" (click)="resetContext()">
              {{ translate('otp.verify.changePhoneAction') }}
            </a>
          </div>
        </form>
      </div>
    </section>
  `
})
export class OtpVerifyComponent implements OnInit {
  phoneNumber = '';
  channel = 'sms';
  code = '';
  loading = false;
  verificationResult: OtpVerificationResultResponse | null = null;

  constructor(
    private readonly otpApiService: OtpApiService,
    private readonly notificationService: NotificationService
  ) {}

  get channelLabelKey(): MessageKey {
    return this.channelLabelKeyByValue(this.channel);
  }

  ngOnInit(): void {
    const pendingContext = this.otpApiService.getPendingOtpContext();
    if (!pendingContext) {
      this.notificationService.showError(this.translate('otp.verify.error.missingContext'));
      return;
    }

    this.phoneNumber = pendingContext.phoneNumber;
    this.channel = pendingContext.channel;
  }

  translate(key: MessageKey): string {
    return t(key);
  }

  checkOtp(): void {
    const normalizedPhone = this.normalizeCurrentPhoneNumber();
    if (!normalizedPhone) {
      this.notificationService.showError(this.translate('otp.request.validation.phoneRequired'));
      return;
    }
    if (!this.code.trim()) {
      this.notificationService.showError(this.translate('otp.verify.validation.codeRequired'));
      return;
    }

    this.loading = true;
    this.phoneNumber = normalizedPhone;
    this.otpApiService.savePendingOtpContext(normalizedPhone, this.channel);
    this.otpApiService.checkPhoneOtp(normalizedPhone, this.code.trim(), this.channel).subscribe({
      next: (result) => {
        this.verificationResult = result;
        if (result.approved) {
          this.notificationService.showSuccess(this.translate('otp.verify.success.approved'));
          this.otpApiService.clearPendingOtpContext();
          return;
        }

        this.notificationService.showError(this.translate('otp.verify.error.rejected'));
      },
      error: () => {
        this.notificationService.showError(this.translate('otp.verify.error.check'));
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  resendOtp(): void {
    const normalizedPhone = this.normalizeCurrentPhoneNumber();
    if (!normalizedPhone) {
      this.notificationService.showError(this.translate('otp.request.validation.phoneRequired'));
      return;
    }

    this.loading = true;
    this.phoneNumber = normalizedPhone;
    this.otpApiService.savePendingOtpContext(normalizedPhone, this.channel);
    this.otpApiService.sendPhoneOtp(normalizedPhone, this.channel).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate('otp.verify.success.resent'));
      },
      error: () => {
        this.notificationService.showError(this.translate('otp.request.error.send'));
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  resetContext(): boolean {
    this.otpApiService.clearPendingOtpContext();
    this.code = '';
    this.verificationResult = null;
    return true;
  }

  handlePhoneNumberChange(): void {
    this.verificationResult = null;
  }

  private channelLabelKeyByValue(channel: string): MessageKey {
    return channel === 'call'
      ? 'users.otpChannel.call'
      : channel === 'whatsapp'
        ? 'users.otpChannel.whatsapp'
        : 'users.otpChannel.sms';
  }

  private normalizeCurrentPhoneNumber(): string {
    return this.phoneNumber.trim();
  }
}