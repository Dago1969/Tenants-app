package com.qtm.tenants.therapeuticplan.entity;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import com.qtm.tenants.doctor.entity.DoctorEntity;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class TherapeuticPlanDoctorAssignmentEntity {
    @Id
    private Long id;

    @ManyToOne
    private DoctorEntity doctor;

    private Integer priorityIndex;

    @ManyToOne
    private TherapeuticPlanEntity therapeuticPlan;

    @Builder
    public TherapeuticPlanDoctorAssignmentEntity(Long id, DoctorEntity doctor, Integer priorityIndex) {
        this.id = id;
        this.doctor = doctor;
        this.priorityIndex = priorityIndex;
    }
}
