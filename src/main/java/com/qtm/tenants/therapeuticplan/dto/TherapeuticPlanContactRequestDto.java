package com.qtm.tenants.therapeuticplan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO della richiesta contatto collegata al piano terapeutico e consultabile prima dell'inserimento in prenotazione attivita.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TherapeuticPlanContactRequestDto {

    private Long id;
    private Long therapeuticPlanId;
    private Long patientId;
    private String patientName;
    private LocalDate requestDate;
    private String requestType;
    private String outpatientClinic;
    private Long structureId;
    private String structureName;
    private String status;
}