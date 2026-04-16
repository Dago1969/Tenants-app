package com.qtm.tenants.notification.mapper;

import com.qtm.tenants.notification.dto.NotificationDto;
import com.qtm.tenants.notification.entity.NotificationEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper Spring per conversione tra NotificationEntity e NotificationDto.
 */
@Component
public class NotificationMapper {

    public NotificationDto toDto(NotificationEntity entity) {
        if (entity == null) {
            return null;
        }

        TherapeuticPlanEntity therapeuticPlan = entity.getTherapeuticPlan();
        return NotificationDto.builder()
                .id(entity.getId())
                .therapeuticPlanId(therapeuticPlan != null ? therapeuticPlan.getId() : null)
                .sentDate(entity.getSentDate())
                .sentByOperator(entity.getSentByOperator())
                .subject(entity.getSubject())
                .message(entity.getMessage())
                .confirmed(entity.getConfirmed())
                .confirmationDate(entity.getConfirmationDate())
                .confirmedByDoctor(entity.getConfirmedByDoctor())
                .notes(entity.getNotes())
                .build();
    }

    public NotificationEntity toNewEntity(NotificationDto dto, TherapeuticPlanEntity therapeuticPlan) {
        NotificationEntity entity = new NotificationEntity();
        updateEntity(entity, dto, therapeuticPlan);
        entity.setId(dto.getId());
        return entity;
    }

    public void updateEntity(NotificationEntity entity, NotificationDto dto, TherapeuticPlanEntity therapeuticPlan) {
        entity.setTherapeuticPlan(therapeuticPlan);
        entity.setSentDate(dto.getSentDate());
        entity.setSentByOperator(dto.getSentByOperator());
        entity.setSubject(dto.getSubject());
        entity.setMessage(dto.getMessage());
        entity.setConfirmed(dto.getConfirmed());
        entity.setConfirmationDate(dto.getConfirmationDate());
        entity.setConfirmedByDoctor(dto.getConfirmedByDoctor());
        entity.setNotes(dto.getNotes());
    }
}