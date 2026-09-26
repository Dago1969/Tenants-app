package com.qtm.tenants.therapeuticplan.mapper;

import org.springframework.stereotype.Component;

import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanActivityBookingDto;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanActivityBookingEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;

/**
 * Mapper Spring per convertire entity e DTO della prenotazione attivita.
 */
@Component
public class TherapeuticPlanActivityBookingMapper {

    public TherapeuticPlanActivityBookingDto toDto(TherapeuticPlanActivityBookingEntity entity) {
        return toDto(entity, null, null);
    }

    public TherapeuticPlanActivityBookingDto toDto(TherapeuticPlanActivityBookingEntity entity, String patientName) {
        return toDto(entity, patientName, null);
    }

    public TherapeuticPlanActivityBookingDto toDto(
            TherapeuticPlanActivityBookingEntity entity,
            String patientName,
            String structureName
    ) {
        if (entity == null) {
            return null;
        }

        TherapeuticPlanEntity therapeuticPlan = entity.getTherapeuticPlan();

        return TherapeuticPlanActivityBookingDto.builder()
                .id(entity.getId())
                .therapeuticPlanId(therapeuticPlan != null ? therapeuticPlan.getId() : null)
                .patientId(entity.getPatientId())
                .patientName(patientName)
                .structureId(entity.getStructureId())
                .structureName(structureName)
                .bookingDate(entity.getBookingDate())
                .visitType(entity.getVisitType())
                .protocolPlanned(entity.getProtocolPlanned())
                .build();
    }

    public TherapeuticPlanActivityBookingEntity toNewEntity(
            TherapeuticPlanActivityBookingDto dto,
            TherapeuticPlanEntity therapeuticPlan
    ) {
        return TherapeuticPlanActivityBookingEntity.builder()
                .id(dto.getId())
                .therapeuticPlan(therapeuticPlan)
                .patientId(dto.getPatientId())
                .structureId(dto.getStructureId())
                .bookingDate(dto.getBookingDate())
                .visitType(dto.getVisitType())
                .protocolPlanned(dto.getProtocolPlanned())
                .build();
    }
}