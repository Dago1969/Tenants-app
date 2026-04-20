package com.qtm.tenants.therapeuticplan.mapper;

import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanVisitDto;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanVisitEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper semplice per convertire tra Entity e DTO della visita.
 */
@Component
public class TherapeuticPlanVisitMapper {

    public TherapeuticPlanVisitDto toDto(TherapeuticPlanVisitEntity e) {
        if (e == null) return null;
        return TherapeuticPlanVisitDto.builder()
            .therapeuticPlanId(e.getTherapeuticPlanId())
            .date(e.getDate())
            .startTherapy(e.getStartTherapy())
            .duodopa(e.getDuodopa())
            .caregiver(e.getCaregiver())
            .clinicalCenter(e.getClinicalCenter())
            .neurologist(e.getNeurologist())
            .gastroenterologist(e.getGastroenterologist())
            .type(e.getType())
            .priority(e.getPriority())
            .jsonVisit(e.getJsonVisit())
            .build();
    }

    public TherapeuticPlanVisitEntity toEntity(TherapeuticPlanVisitDto d) {
        if (d == null) return null;
        TherapeuticPlanVisitEntity e = TherapeuticPlanVisitEntity.builder()
            .therapeuticPlanId(d.getTherapeuticPlanId())
            .date(d.getDate())
            .startTherapy(d.getStartTherapy())
            .duodopa(d.getDuodopa())
            .caregiver(d.getCaregiver())
            .clinicalCenter(d.getClinicalCenter())
            .neurologist(d.getNeurologist())
            .gastroenterologist(d.getGastroenterologist())
            .type(d.getType())
            .priority(d.getPriority())
            .jsonVisit(d.getJsonVisit())
            .build();
        return e;
    }
}
