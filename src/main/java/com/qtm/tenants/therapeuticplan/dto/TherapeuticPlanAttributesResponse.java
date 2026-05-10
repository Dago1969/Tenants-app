package com.qtm.tenants.therapeuticplan.dto;

import java.util.List;

/**
 * DTO che espone la lista degli attributi autorizzabili del piano terapeutico.
 */
public class TherapeuticPlanAttributesResponse {
    private List<TherapeuticPlanAttributeDto> attributes;

    public TherapeuticPlanAttributesResponse(List<TherapeuticPlanAttributeDto> attributes) {
        this.attributes = attributes;
    }

    public List<TherapeuticPlanAttributeDto> getAttributes() {
        return attributes;
    }

    public void setAttributes(List<TherapeuticPlanAttributeDto> attributes) {
        this.attributes = attributes;
    }
}
