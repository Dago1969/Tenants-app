package com.qtm.tenants.therapeuticplan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO della relazione ordinata tra piano terapeutico e professionista sanitario.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TherapeuticPlanProfessionalAssignmentDto {
    private Long professionalId;
    private String professionalName;
    private Integer priorityIndex;
}