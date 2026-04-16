package com.qtm.tenants.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO notifica di riepilogo collegata al piano terapeutico e al suo esito di conferma medica.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {

    private Long id;
    private Long therapeuticPlanId;
    private LocalDate sentDate;
    private String sentByOperator;
    private String subject;
    private String message;
    private Boolean confirmed;
    private LocalDate confirmationDate;
    private String confirmedByDoctor;
    private String notes;
}