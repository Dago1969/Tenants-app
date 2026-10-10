package com.qtm.tenants.therapeuticplan.dto;

/** Risposta della verifica OTP con ticket monouso per il salvataggio del consenso survey. */
public record TherapeuticPlanSurveyOtpVerificationResponse(
        boolean approved,
        String destination,
        String channel,
        String status,
        String token
) {
}
