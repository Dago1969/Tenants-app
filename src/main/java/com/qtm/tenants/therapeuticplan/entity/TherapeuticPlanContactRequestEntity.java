package com.qtm.tenants.therapeuticplan.entity;

import com.qtm.tenants.structure.entity.StructureEntity;
import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
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

/**
 * Entity della richiesta contatto associata a piano terapeutico, paziente e centro medico.
 */
@Entity
@Table(name = "therapeutic_plan_contact_request")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TherapeuticPlanContactRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "therapeutic_plan_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private TherapeuticPlanEntity therapeuticPlan;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "request_date", nullable = false)
    private LocalDate requestDate;

    @Column(name = "request_type", nullable = false, length = 64)
    private String requestType;

    @Column(name = "outpatient_clinic", nullable = false, length = 255)
    private String outpatientClinic;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "structure_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private StructureEntity structure;

    @Column(name = "status", nullable = false, length = 64)
    private String status;

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