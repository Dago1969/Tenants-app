package com.qtm.tenants.therapeuticplan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO per la visita associata al piano terapeutico. La chiave è composta da therapeuticPlanId + data/ora visita.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TherapeuticPlanVisitDto {
    private Long therapeuticPlanId;
    private LocalDateTime date;
    private String duodopa;
    private String caregiver;
    private String clinicalCenter;
    private String neurologist;
    private String gastroenterologist;
    private String type;
    private String priority;
    /**
     * Campo JSON che contiene i dati dell'inserimento (può essere molto grande).
     */
    private String jsonVisit;
}
