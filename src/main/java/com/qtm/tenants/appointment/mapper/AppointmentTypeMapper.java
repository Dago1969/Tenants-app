package com.qtm.tenants.appointment.mapper;

import com.qtm.tenants.appointment.dto.AppointmentTypeDto;
import com.qtm.tenants.appointment.entity.AppointmentTypeEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper Spring per conversione tra AppointmentTypeEntity e AppointmentTypeDto.
 */
@Component
public class AppointmentTypeMapper {

    public AppointmentTypeDto toDto(AppointmentTypeEntity entity) {
        if (entity == null) {
            return null;
        }

        return AppointmentTypeDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .durationMinutes(entity.getDurationMinutes())
                .build();
    }

    public AppointmentTypeEntity toEntity(AppointmentTypeDto dto) {
        if (dto == null) {
            return null;
        }

        return AppointmentTypeEntity.builder()
                .id(dto.getId())
                .name(dto.getName())
                .description(dto.getDescription())
                .durationMinutes(dto.getDurationMinutes())
                .build();
    }

    public void updateEntity(AppointmentTypeEntity entity, AppointmentTypeDto dto) {
        if (entity == null || dto == null) {
            return;
        }

        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setDurationMinutes(dto.getDurationMinutes());
    }
}
