package com.qtm.tenants.alert.mapper;

import com.qtm.tenants.alert.dto.AlertDto;
import com.qtm.tenants.alert.entity.AlertEntity;
import com.qtm.tenants.doctor.entity.DoctorEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper Spring per conversione tra AlertEntity e AlertDto.
 */
@Component
public class AlertMapper {

    public AlertDto toDto(AlertEntity entity) {
        if (entity == null) {
            return null;
        }

        TherapeuticPlanEntity therapeuticPlan = entity.getTherapeuticPlan();
        DoctorEntity doctor = entity.getDoctor();

        return AlertDto.builder()
                .id(entity.getId())
                .therapeuticPlanId(therapeuticPlan != null ? therapeuticPlan.getId() : null)
                .doctorId(doctor != null ? doctor.getId() : null)
                .doctorName(doctor != null ? doctor.getFullName() : null)
                .date(entity.getAlertDate())
                .subject(entity.getSubject())
                .confirmationRequired(entity.getConfirmationRequired())
                .confirmationSent(entity.getConfirmationSent())
                .build();
    }

    public AlertEntity toNewEntity(AlertDto dto, TherapeuticPlanEntity therapeuticPlan, DoctorEntity doctor) {
        AlertEntity entity = new AlertEntity();
        updateEntity(entity, dto, therapeuticPlan, doctor);
        entity.setId(dto.getId());
        return entity;
    }

    public void updateEntity(AlertEntity entity, AlertDto dto, TherapeuticPlanEntity therapeuticPlan, DoctorEntity doctor) {
        entity.setTherapeuticPlan(therapeuticPlan);
        entity.setDoctor(doctor);
        entity.setAlertDate(dto.getDate());
        entity.setSubject(dto.getSubject());
        entity.setConfirmationRequired(dto.getConfirmationRequired());
        entity.setConfirmationSent(dto.getConfirmationSent());
    }
}