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
        StructureEntity structure = null;
        try {
            java.lang.reflect.Field f = entity.getClass().getDeclaredField("structureId");
            f.setAccessible(true);
            Object sid = f.get(entity);
            if (sid != null) {
                StructureEntity tmp = new StructureEntity();
                tmp.setId((Long) sid);
                structure = tmp;
            }
        } catch (NoSuchFieldException | IllegalAccessException ignored) {
        }

        return TherapeuticPlanContactRequestDto.builder()
                .id(entity.getId())
                .therapeuticPlanId(therapeuticPlan != null ? therapeuticPlan.getId() : null)
                .patientId(entity.getPatientId())
                .patientName(patientName)
                .requestDate(entity.getRequestDate())
                .requestType(entity.getRequestType())
                .outpatientClinic(entity.getOutpatientClinic())
                .structureId(entity.getStructureId())
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
            .structureId(structure != null ? structure.getId() : null)
            .status(dto.getStatus())
            .build();
    }
}