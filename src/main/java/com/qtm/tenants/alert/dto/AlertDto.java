package com.qtm.tenants.alert.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO alert per le attivita del piano terapeutico che richiedono conferma o valutazione medica.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertDto {

    private Long id;
    private Long therapeuticPlanId;
    private Long doctorId;
    private String doctorName;
    private LocalDate date;
    private String subject;
    private Boolean confirmationRequired;
    private String confirmationSent;
}