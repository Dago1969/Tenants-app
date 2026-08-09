package com.qtm.tenants.therapeuticplan.entity;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import com.qtm.tenants.nurse.entity.NurseEntity;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class TherapeuticPlanNurseAssignmentEntity {
    @Id
    private Long id;

    @ManyToOne
    private NurseEntity nurse;

    private Integer priorityIndex;

    @ManyToOne
    private TherapeuticPlanEntity therapeuticPlan;

    @Builder
    public TherapeuticPlanNurseAssignmentEntity(Long id, NurseEntity nurse, Integer priorityIndex) {
        this.id = id;
        this.nurse = nurse;
        this.priorityIndex = priorityIndex;
    }
}
