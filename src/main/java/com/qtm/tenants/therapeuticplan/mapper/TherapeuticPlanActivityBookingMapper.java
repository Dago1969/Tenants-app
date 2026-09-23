package com.qtm.tenants.therapeuticplan.mapper;

import com.qtm.tenants.structure.entity.StructureEntity;
import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanActivityBookingDto;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanActivityBookingEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper Spring per convertire entity e DTO della prenotazione attivita.
 */
@Component
public class TherapeuticPlanActivityBookingMapper {

    public TherapeuticPlanActivityBookingDto toDto(TherapeuticPlanActivityBookingEntity entity) {
        return toDto(entity, null);
    }

    public TherapeuticPlanActivityBookingDto toDto(TherapeuticPlanActivityBookingEntity entity, String patientName) {
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

        return TherapeuticPlanActivityBookingDto.builder()
                .id(entity.getId())
                .therapeuticPlanId(therapeuticPlan != null ? therapeuticPlan.getId() : null)
                .patientId(entity.getPatientId())
                .patientName(patientName)
                .structureId(entity.getStructureId())
                .structureName(structure != null ? structure.getName() : null)
                .bookingDate(entity.getBookingDate())
                .visitType(entity.getVisitType())
                .protocolPlanned(entity.getProtocolPlanned())
                .build();
    }

    public TherapeuticPlanActivityBookingEntity toNewEntity(
            TherapeuticPlanActivityBookingDto dto,
            TherapeuticPlanEntity therapeuticPlan,
            StructureEntity structure
    ) {
        return TherapeuticPlanActivityBookingEntity.builder()
                .id(dto.getId())
                .therapeuticPlan(therapeuticPlan)
                .patientId(dto.getPatientId())
            .structureId(structure != null ? structure.getId() : null)
                .bookingDate(dto.getBookingDate())
                .visitType(dto.getVisitType())
                .protocolPlanned(dto.getProtocolPlanned())
                .build();
    }
}