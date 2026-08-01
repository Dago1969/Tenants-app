package com.qtm.tenants.therapeuticplan.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class TherapeuticPlanAttributesResponse {
    private List<TherapeuticPlanAttributeDto> attributes;

    public TherapeuticPlanAttributesResponse(List<TherapeuticPlanAttributeDto> attributes) {
        this.attributes = attributes;
    }
}

