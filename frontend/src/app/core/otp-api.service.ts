import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OtpVerificationResultResponse {
  userId: number | null;
  destination: string;
  channel: string;
  status: string;
  approved: boolean;
  verificationSid: string;
}

interface PhoneOtpSendRequest {
  phoneNumber: string;
  channel: string;
}

interface PhoneOtpCheckRequest extends PhoneOtpSendRequest {
  code: string;
}

interface PendingOtpContext {
  phoneNumber: string;
  channel: string;
}

/**
 * Service frontend per il flusso OTP demo basato sul solo numero di telefono.
 */
@Injectable({ providedIn: 'root' })
export class OtpApiService {
  private readonly endpoint = `${environment.apiBaseUrl}/users/otp`;
  private readonly pendingOtpStorageKey = 'tenapp_otp_pending_context';

  constructor(private readonly http: HttpClient) {}

  sendPhoneOtp(phoneNumber: string, channel: string): Observable<OtpVerificationResultResponse> {
    return this.http.post<OtpVerificationResultResponse>(`${this.endpoint}/send`, {
      phoneNumber,
      channel
    } satisfies PhoneOtpSendRequest);
  }

  checkPhoneOtp(phoneNumber: string, code: string, channel: string): Observable<OtpVerificationResultResponse> {
    return this.http.post<OtpVerificationResultResponse>(`${this.endpoint}/check`, {
      phoneNumber,
      code,
      channel
    } satisfies PhoneOtpCheckRequest);
  }

  savePendingOtpContext(phoneNumber: string, channel: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    const context: PendingOtpContext = { phoneNumber, channel };
    window.sessionStorage.setItem(this.pendingOtpStorageKey, JSON.stringify(context));
  }

  getPendingOtpContext(): PendingOtpContext | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const rawValue = window.sessionStorage.getItem(this.pendingOtpStorageKey);
    if (!rawValue) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawValue) as Partial<PendingOtpContext>;
      if (!parsed.phoneNumber || !parsed.channel) {
        return null;
      }

      return {
        phoneNumber: parsed.phoneNumber,
        channel: parsed.channel
      };
    } catch {
      return null;
    }
  }

  clearPendingOtpContext(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.removeItem(this.pendingOtpStorageKey);
  }
}