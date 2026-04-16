package com.qtm.tenants.therapeuticplan.entity;

import com.qtm.tenants.doctor.entity.DoctorEntity;
import com.qtm.tenants.equipment.entity.EquipmentEntity;
import com.qtm.tenants.nurse.entity.NurseEntity;
import com.qtm.tenants.structure.entity.StructureEntity;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
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
 * Entity del piano terapeutico con associazioni a paziente, struttura, operatori sanitari e attrezzature.
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

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "therapeutic_plan_equipment",
            joinColumns = @jakarta.persistence.JoinColumn(name = "therapeutic_plan_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT)),
            inverseJoinColumns = @jakarta.persistence.JoinColumn(name = "equipment_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    )
    @Builder.Default
    private List<EquipmentEntity> equipments = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @jakarta.persistence.JoinColumn(name = "structure_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private StructureEntity structure;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @jakarta.persistence.JoinColumn(name = "nurse_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private NurseEntity nurse;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @jakarta.persistence.JoinColumn(name = "doctor_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private DoctorEntity doctor;

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
}