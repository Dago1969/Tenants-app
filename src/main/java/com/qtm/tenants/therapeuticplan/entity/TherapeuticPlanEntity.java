package com.qtm.tenants.therapeuticplan.entity;

import com.qtm.tenants.equipment.entity.EquipmentEntity;
import com.qtm.tenants.structure.entity.StructureEntity;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.CascadeType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity del piano terapeutico con riferimenti clinici, operatori sanitari ordinati e attrezzature collegate.
 */
@Entity
@Table(name = "therapeutic_plan")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TherapeuticPlanEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "project_code", nullable = false, length = 128)
    private String projectCode;

    @OneToMany(mappedBy = "assignedTo", fetch = FetchType.LAZY)
    @Builder.Default
    private List<EquipmentEntity> equipments = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @jakarta.persistence.JoinColumn(name = "structure_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private StructureEntity structure;

    @OneToMany(mappedBy = "therapeuticPlan", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("priorityIndex ASC")
    @Builder.Default
    private List<TherapeuticPlanNurseAssignmentEntity> nurseAssignments = new ArrayList<>();

    @OneToMany(mappedBy = "therapeuticPlan", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("priorityIndex ASC")
    @Builder.Default
    private List<TherapeuticPlanDoctorAssignmentEntity> doctorAssignments = new ArrayList<>();

    @Column(name = "drug_code", nullable = false, length = 128)
    private String drugCode;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public TherapeuticPlanNurseAssignmentEntity getPrevalentNurseAssignment() {
        return nurseAssignments == null || nurseAssignments.isEmpty() ? null : nurseAssignments.get(0);
    }

    public TherapeuticPlanDoctorAssignmentEntity getPrevalentDoctorAssignment() {
        return doctorAssignments == null || doctorAssignments.isEmpty() ? null : doctorAssignments.get(0);
    }
}