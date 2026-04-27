package com.qtm.tenants.otp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Payload per avviare un OTP Twilio partendo solo da numero di telefono e canale opzionale.
 */
@Getter
@Setter
@NoArgsConstructor
public class OtpPhoneVerificationSendRequest {

    @NotBlank(message = "Numero di telefono obbligatorio")
    private String phoneNumber;

    private String channel;
}