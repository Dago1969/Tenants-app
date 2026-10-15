import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageKey, t } from '../i18n/messages';

export interface ConsentOtpOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-consent-otp-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './consent-otp-form.component.css',
  template: `
    <section class="consent-otp-form" [attr.aria-busy]="pending">
      <div class="consent-otp-send-row">
        <label class="consent-otp-field">
          <span>{{ translate(channelLabelKey) }}</span>
          <select [ngModel]="channel" [ngModelOptions]="{ standalone: true }" (ngModelChange)="channelChange.emit($event)" [disabled]="disabled || pending">
            <option *ngFor="let option of channelOptions" [ngValue]="option.value">{{ option.label }}</option>
          </select>
        </label>

        <label class="consent-otp-field consent-otp-recipient">
          <span>{{ translate(recipientLabelKey) }}</span>
          <select *ngIf="recipientOptions.length > 0; else resolvedRecipient" [ngModel]="recipient" [ngModelOptions]="{ standalone: true }" (ngModelChange)="recipientChange.emit($event)" [disabled]="disabled || pending">
            <option *ngFor="let option of recipientOptions" [ngValue]="option.value">{{ option.label }}</option>
          </select>
          <ng-template #resolvedRecipient>
            <input type="text" [value]="destination" readonly />
          </ng-template>
        </label>

        <label class="consent-otp-field consent-otp-date">
          <span>{{ translate(consentDateLabelKey) }}</span>
          <input type="datetime-local" [value]="consentDate" readonly />
        </label>
      </div>

      <div class="consent-otp-verify-row">
        <button type="button" class="consent-otp-button" (click)="send.emit()" [disabled]="disabled || pending || !channel">
          {{ translate(pending ? sendingLabelKey : sendLabelKey) }}
        </button>
        <label class="consent-otp-field">
          <span>{{ translate(codeLabelKey) }}</span>
          <input type="text" inputmode="numeric" autocomplete="one-time-code" [ngModel]="code" [ngModelOptions]="{ standalone: true }" (ngModelChange)="codeChange.emit($event)" [disabled]="disabled || pending || !sent" />
        </label>
        <button type="button" class="consent-otp-button" (click)="verify.emit()" [disabled]="disabled || pending || !sent || !code.trim() || verified">
          {{ translate(verifyLabelKey) }}
        </button>
      </div>

      <p *ngIf="status" class="consent-otp-status" [class.consent-otp-status-success]="verified" role="status">{{ status }}</p>
    </section>
  `
})
export class ConsentOtpFormComponent {
  @Input() channel = '';
  @Input() channelOptions: ConsentOtpOption[] = [];
  @Input() recipient = '';
  @Input() recipientOptions: ConsentOtpOption[] = [];
  @Input() destination = '';
  @Input() code = '';
  @Input() consentDate = '';
  @Input() pending = false;
  @Input() sent = false;
  @Input() verified = false;
  @Input() disabled = false;
  @Input() status = '';
  @Input() channelLabelKey: MessageKey = 'patients.privacy.otp.channel';
  @Input() recipientLabelKey: MessageKey = 'patients.field.otpRecipient';
  @Input() sendLabelKey: MessageKey = 'patients.privacy.otp.sendAction';
  @Input() sendingLabelKey: MessageKey = 'patients.privacy.otp.status.sending';
  @Input() codeLabelKey: MessageKey = 'patients.privacy.otp.code';
  @Input() verifyLabelKey: MessageKey = 'patients.privacy.otp.verifyAction';
  @Input() consentDateLabelKey: MessageKey = 'patients.field.dataProcessingConsentDateTime';

  @Output() channelChange = new EventEmitter<string>();
  @Output() recipientChange = new EventEmitter<string>();
  @Output() codeChange = new EventEmitter<string>();
  @Output() send = new EventEmitter<void>();
  @Output() verify = new EventEmitter<void>();

  translate(key: MessageKey): string {
    return t(key);
  }
}