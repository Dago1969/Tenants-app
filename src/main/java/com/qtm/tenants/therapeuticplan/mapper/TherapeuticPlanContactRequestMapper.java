package com.qtm.tenants.therapeuticplan.mapper;

import com.qtm.tenants.structure.entity.StructureEntity;
import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanContactRequestDto;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanContactRequestEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import org.springframework.stereotype.Component;

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
        StructureEntity structure = entity.getStructure();

        return TherapeuticPlanContactRequestDto.builder()
                .id(entity.getId())
                .therapeuticPlanId(therapeuticPlan != null ? therapeuticPlan.getId() : null)
                .patientId(entity.getPatientId())
                .patientName(patientName)
                .requestDate(entity.getRequestDate())
                .requestType(entity.getRequestType())
                .outpatientClinic(entity.getOutpatientClinic())
                .structureId(structure != null ? structure.getId() : null)
                .structureName(structure != null ? structure.getName() : null)
                .status(entity.getStatus())
                .build();
    }

    public TherapeuticPlanContactRequestEntity toNewEntity(
            TherapeuticPlanContactRequestDto dto,
            TherapeuticPlanEntity therapeuticPlan,
            StructureEntity structure
    ) {
        return TherapeuticPlanContactRequestEntity.builder()
                .id(dto.getId())
                .therapeuticPlan(therapeuticPlan)
                .patientId(dto.getPatientId())
                .requestDate(dto.getRequestDate())
                .requestType(dto.getRequestType())
                .outpatientClinic(dto.getOutpatientClinic())
                .structure(structure)
                .status(dto.getStatus())
                .build();
    }
}