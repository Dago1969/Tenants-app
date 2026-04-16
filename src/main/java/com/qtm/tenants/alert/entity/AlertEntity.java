package com.qtm.tenants.alert.entity;

import com.qtm.tenants.doctor.entity.DoctorEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
 * Entity alert collegata al piano terapeutico e al medico responsabile della conferma o valutazione.
 */
@Entity
@Table(name = "therapeutic_plan_alert")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @jakarta.persistence.JoinColumn(name = "therapeutic_plan_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private TherapeuticPlanEntity therapeuticPlan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @jakarta.persistence.JoinColumn(name = "doctor_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private DoctorEntity doctor;

    @Column(name = "alert_date", nullable = false)
    private LocalDate alertDate;

    @Column(name = "subject", nullable = false, length = 255)
    private String subject;

    @Column(name = "confirmation_required", nullable = false)
    private Boolean confirmationRequired;

    @Column(name = "confirmation_sent", nullable = false, length = 8)
    private String confirmationSent;

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