package com.qtm.tenants.therapeuticplan.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TherapeuticPlanProfessionalAssignmentDto {
    private Long id;
    private Long professionalId;
    private String professionalName;
    private Integer priorityIndex;
}
