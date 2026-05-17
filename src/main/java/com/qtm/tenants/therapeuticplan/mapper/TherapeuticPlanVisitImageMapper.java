package com.qtm.tenants.therapeuticplan.mapper;

import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanVisitImageDto;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanVisitImageEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper per convertire tra Entity e DTO delle immagini di visita.
 * Il DTO non contiene i dati binari (imageData) per evitare trasferimenti inutili.
 */
@Component
public class TherapeuticPlanVisitImageMapper {

    public TherapeuticPlanVisitImageDto toDto(TherapeuticPlanVisitImageEntity e) {
        if (e == null) return null;
        return TherapeuticPlanVisitImageDto.builder()
                .id(e.getId())
                .therapeuticPlanId(e.getTherapeuticPlanId())
                .visitDate(e.getVisitDate())
                .imageName(e.getImageName())
                .imageType(e.getImageType())
                .description(e.getDescription())
                .uploadDate(e.getUploadDate())
                .build();
    }

    public TherapeuticPlanVisitImageEntity toEntity(TherapeuticPlanVisitImageDto d) {
        if (d == null) return null;
        return TherapeuticPlanVisitImageEntity.builder()
                .id(d.getId())
                .therapeuticPlanId(d.getTherapeuticPlanId())
                .visitDate(d.getVisitDate())
                .imageName(d.getImageName())
                .imageType(d.getImageType())
                .description(d.getDescription())
                .uploadDate(d.getUploadDate())
                .build();
    }
}
