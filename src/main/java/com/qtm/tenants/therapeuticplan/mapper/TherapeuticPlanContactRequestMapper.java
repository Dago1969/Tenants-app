package com.qtm.tenants.therapeuticplan.mapper;

import org.springframework.stereotype.Component;

import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanContactRequestDto;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanContactRequestEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;

/**
 * Mapper Spring per convertire entity e DTO della richiesta contatto del piano terapeutico.
 */
@Component
public class TherapeuticPlanContactRequestMapper {

    public TherapeuticPlanContactRequestDto toDto(TherapeuticPlanContactRequestEntity entity) {
        return toDto(entity, null);
    }

    public TherapeuticPlanContactRequestDto toDto(TherapeuticPlanContactRequestEntity entity, String patientName) {
        if (entity == null) {
            return null;
        }

        TherapeuticPlanEntity therapeuticPlan = entity.getTherapeuticPlan();

        return TherapeuticPlanContactRequestDto.builder()
                .id(entity.getId())
                .therapeuticPlanId(therapeuticPlan != null ? therapeuticPlan.getId() : null)
                .patientId(entity.getPatientId())
                .patientName(patientName)
                .requestDate(entity.getRequestDate())
                .requestType(entity.getRequestType())
                .outpatientClinic(entity.getOutpatientClinic())
                .structureId(entity.getStructureId())
                .status(entity.getStatus())
                .build();
    }

    public TherapeuticPlanContactRequestEntity toNewEntity(
            TherapeuticPlanContactRequestDto dto,
            TherapeuticPlanEntity therapeuticPlan
    ) {
        return TherapeuticPlanContactRequestEntity.builder()
            .id(dto.getId())
            .therapeuticPlan(therapeuticPlan)
            .patientId(dto.getPatientId())
            .requestDate(dto.getRequestDate())
            .requestType(dto.getRequestType())
            .outpatientClinic(dto.getOutpatientClinic())
            .structureId(dto.getStructureId())
            .status(dto.getStatus())
            .build();
    }
}