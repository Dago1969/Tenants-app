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
public class TherapeuticPlanAttributeDto {
    private String name;
    private String label;
    private String description;
    private String type;
}
