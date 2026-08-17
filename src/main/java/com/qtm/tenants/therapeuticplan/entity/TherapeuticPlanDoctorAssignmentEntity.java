package com.qtm.tenants.therapeuticplan.entity;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import com.qtm.tenants.doctor.entity.DoctorEntity;

@Entity
@Table(name = "therapeutic_plan_doctor_assignment")
@Getter
@Setter
@NoArgsConstructor
public class TherapeuticPlanDoctorAssignmentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private DoctorEntity doctor;

    @jakarta.persistence.Column(name = "priority_index", nullable = false)
    private Integer priorityIndex;

    @ManyToOne(optional = false)
    @JoinColumn(name = "therapeutic_plan_id", nullable = false)
    private TherapeuticPlanEntity therapeuticPlan;

    @Builder
    public TherapeuticPlanDoctorAssignmentEntity(Long id, DoctorEntity doctor, Integer priorityIndex) {
        this.id = id;
        this.doctor = doctor;
        this.priorityIndex = priorityIndex;
    }
}
