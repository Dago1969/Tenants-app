package com.qtm.tenants.equipment.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity che rappresenta un tipo di equipaggiamento (macchinario/dispositivo).
 * Gestisce anche la presenza e il path di due file JSON opzionali.
 */
@Entity
@Table(name = "equipment_type")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentTypeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 64)
    private String code;

    @Column(name = "name", nullable = false, length = 128)
    private String name;

    @Column(name = "description", length = 512)
    private String description;

    @Column(name = "equipment_use", length = 256)
    private String use;

    @Column(name = "cost", precision = 19, scale = 2)
    private BigDecimal cost;

    @Column(name = "supplier", length = 128)
    private String supplier;

    @Column(name = "serial_number_required")
    private boolean serialNumberRequired;

    @Column(name = "principal_json_present")
    private boolean principalJsonPresent;

    @Column(name = "principal_json_path", columnDefinition = "TEXT")
    private String principalJsonPath;

    @Column(name = "secondary_json_present")
    private boolean secondaryJsonPresent;

    @Column(name = "secondary_json_path", columnDefinition = "TEXT")
    private String secondaryJsonPath;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "status", length = 32, nullable = false)
    private String status;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
