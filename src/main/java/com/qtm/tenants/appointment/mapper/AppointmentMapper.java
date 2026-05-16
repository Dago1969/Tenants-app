package com.qtm.tenants.appointment.mapper;

import com.qtm.tenants.appointment.dto.AppointmentDto;
import com.qtm.tenants.appointment.entity.AppointmentEntity;
import com.qtm.tenants.appointment.entity.AppointmentTypeEntity;
import com.qtm.tenants.nurse.entity.NurseEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * Mapper Spring per conversione tra AppointmentEntity e AppointmentDto.
 */
@Component
public class AppointmentMapper {

    public AppointmentDto toDto(AppointmentEntity entity) {
        if (entity == null) {
            return null;
        }

        AppointmentTypeEntity appointmentType = entity.getAppointmentType();
        NurseEntity nurse = entity.getNurse();
        TherapeuticPlanEntity therapeuticPlan = entity.getTherapeuticPlan();

        return AppointmentDto.builder()
                .id(entity.getId())
                .therapeuticPlanId(therapeuticPlan != null ? therapeuticPlan.getId() : null)
                .therapeuticPlanPatientDisplayName(therapeuticPlan != null ? therapeuticPlan.getId().toString() : null)
                .appointmentTypeId(appointmentType != null ? appointmentType.getId() : null)
                .appointmentTypeName(appointmentType != null ? appointmentType.getName() : null)
                .appointmentTypeDurationMinutes(appointmentType != null ? appointmentType.getDurationMinutes() : null)
                .nurseId(nurse != null ? nurse.getId() : null)
                .nurseName(nurse != null ? nurse.getFullName() : null)
                .startDateTime(entity.getStartDateTime())
                .endDateTime(entity.getEndDateTime())
                .recurrenceType(entity.getRecurrenceType())
                .recurrenceEndDate(entity.getRecurrenceEndDate())
                .reminderEnabled(entity.getReminderEnabled())
                .reminderMinutesBefore(entity.getReminderMinutesBefore())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .build();
    }

    public AppointmentEntity toEntity(
            AppointmentDto dto,
            TherapeuticPlanEntity therapeuticPlan,
            AppointmentTypeEntity appointmentType,
            NurseEntity nurse
    ) {
        if (dto == null) {
            return null;
        }

        return AppointmentEntity.builder()
                .id(dto.getId())
                .therapeuticPlan(therapeuticPlan)
                .appointmentType(appointmentType)
                .nurse(nurse)
                .startDateTime(dto.getStartDateTime())
                .endDateTime(dto.getEndDateTime())
                .recurrenceType(dto.getRecurrenceType())
                .recurrenceEndDate(dto.getRecurrenceEndDate())
                .reminderEnabled(Objects.requireNonNullElse(dto.getReminderEnabled(), false))
                .reminderMinutesBefore(Objects.requireNonNullElse(dto.getReminderMinutesBefore(), 15))
                .status(Objects.requireNonNullElse(dto.getStatus(), "SCHEDULED"))
                .notes(dto.getNotes())
                .build();
    }

    public void updateEntity(
            AppointmentEntity entity,
            AppointmentDto dto,
            TherapeuticPlanEntity therapeuticPlan,
            AppointmentTypeEntity appointmentType,
            NurseEntity nurse
    ) {
        if (entity == null || dto == null) {
            return;
        }

        entity.setTherapeuticPlan(therapeuticPlan);
        entity.setAppointmentType(appointmentType);
        entity.setNurse(nurse);
        entity.setStartDateTime(dto.getStartDateTime());
        entity.setEndDateTime(dto.getEndDateTime());
        entity.setRecurrenceType(dto.getRecurrenceType());
        entity.setRecurrenceEndDate(dto.getRecurrenceEndDate());
        entity.setReminderEnabled(Objects.requireNonNullElse(dto.getReminderEnabled(), false));
        entity.setReminderMinutesBefore(Objects.requireNonNullElse(dto.getReminderMinutesBefore(), 15));
        entity.setStatus(Objects.requireNonNullElse(dto.getStatus(), "SCHEDULED"));
        entity.setNotes(dto.getNotes());
    }
}
