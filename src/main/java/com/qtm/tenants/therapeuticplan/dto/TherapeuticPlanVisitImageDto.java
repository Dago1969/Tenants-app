package com.qtm.tenants.therapeuticplan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO per un'immagine associata a una visita del piano terapeutico.
 * Usato per il trasferimento dati senza i dati binari.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TherapeuticPlanVisitImageDto {
    private Long id;
    private Long therapeuticPlanId;
    private LocalDateTime visitDate;
    private String imageName;
    private String imageType;
    private String description;
    private LocalDateTime uploadDate;
}
