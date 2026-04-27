package com.qtm.tenants.otp.dto;

import lombok.Builder;

/**
 * Risposta standardizzata per invio e verifica OTP via Twilio Verify.
 */
@Builder
public record OtpVerificationResultResponse(
        Long userId,
        String destination,
        String channel,
        String status,
        boolean approved,
        String verificationSid
) {
}