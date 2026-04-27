package com.qtm.tenants.otp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Payload per verificare un OTP Twilio inviato a un utente TENAPP.
 */
@Getter
@Setter
@NoArgsConstructor
public class OtpVerificationCheckRequest {

    @NotBlank(message = "Codice OTP obbligatorio")
    private String code;
}