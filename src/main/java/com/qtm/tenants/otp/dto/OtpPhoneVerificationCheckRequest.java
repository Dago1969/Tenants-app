package com.qtm.tenants.otp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Payload per verificare un OTP Twilio usando solo numero di telefono e codice ricevuto.
 */
@Getter
@Setter
@NoArgsConstructor
public class OtpPhoneVerificationCheckRequest {

    @NotBlank(message = "Numero di telefono obbligatorio")
    private String phoneNumber;

    @NotBlank(message = "Codice OTP obbligatorio")
    private String code;

    private String channel;
}