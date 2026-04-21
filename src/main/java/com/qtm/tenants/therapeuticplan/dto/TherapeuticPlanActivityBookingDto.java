package com.qtm.tenants.therapeuticplan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO della prenotazione attivita del piano terapeutico con i riferimenti preimpostati a paziente e centro medico.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TherapeuticPlanActivityBookingDto {

    private Long id;
    private Long therapeuticPlanId;
    private Long patientId;
    private String patientName;
    private Long structureId;
    private String structureName;
    private LocalDate bookingDate;
    private String visitType;
    private Boolean protocolPlanned;
}