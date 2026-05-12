package com.qtm.tenants.therapeuticplan.entity;

import com.qtm.tenants.nurse.entity.NurseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

/**
 * Relazione ordinata tra piano terapeutico e infermiere; la priorita piu bassa rappresenta il prevalente.
 */
@Entity
@Table(
        name = "therapeutic_plan_nurse",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_therapeutic_plan_nurse_plan_nurse", columnNames = {"therapeutic_plan_id", "nurse_id"}),
                @UniqueConstraint(name = "uk_therapeutic_plan_nurse_plan_priority", columnNames = {"therapeutic_plan_id", "priority_index"})
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TherapeuticPlanNurseAssignmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "therapeutic_plan_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private TherapeuticPlanEntity therapeuticPlan;

        @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nurse_id", nullable = false)
        @NotFound(action = NotFoundAction.IGNORE)
    private NurseEntity nurse;

    @Column(name = "priority_index", nullable = false)
    private Integer priorityIndex;
}