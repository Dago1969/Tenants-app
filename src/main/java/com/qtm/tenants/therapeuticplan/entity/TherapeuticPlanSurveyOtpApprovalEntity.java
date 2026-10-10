package com.qtm.tenants.therapeuticplan.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Ticket OTP temporaneo che prova l'approvazione Twilio per un singolo consenso survey. */
@Entity
@Table(name = "therapeutic_plan_survey_otp_ticket")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TherapeuticPlanSurveyOtpApprovalEntity {

    @Id
    @Column(name = "token", nullable = false, length = 36)
    private String token;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "therapeutic_plan_id")
    private Long therapeuticPlanId;

    @Column(name = "recipient", nullable = false, length = 32)
    private String recipient;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}
