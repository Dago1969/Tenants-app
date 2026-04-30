package com.qtm.tenants.equipment.entity;

import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Column;
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
 * Entity che rappresenta una singola attrezzatura censita a sistema.
 */
@Entity
@Table(name = "equipment")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipment_type_id", nullable = false)
    private EquipmentTypeEntity equipmentType;

    @Column(name = "code", nullable = false, unique = true, length = 64)
    private String code;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "serial_number", length = 128)
    private String serialNumber;

    @Column(name = "location", length = 255)
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private TherapeuticPlanEntity assignedTo;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "last_revision_date")
    private LocalDate lastRevisionDate;

    @Column(name = "next_revision_date")
    private LocalDate nextRevisionDate;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "primary_json", columnDefinition = "TEXT")
    private String primaryJson;

    @Column(name = "secondary_json", columnDefinition = "TEXT")
    private String secondaryJson;

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