package com.qtm.tenants.appointment.entity;

import com.qtm.tenants.nurse.entity.NurseEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Appuntamento nel piano terapeutico con supporto per ricorrenze e notifiche.
 * Ogni appuntamento ha un tipo (verifica impianto, consegna medicine, prelievo),
 * un infermiere assegnato, orari di inizio/fine e opzionalmente ricorre fino a una data.
 */
@Entity
@Table(name = "appointment")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "therapeutic_plan_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private TherapeuticPlanEntity therapeuticPlan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_type_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private AppointmentTypeEntity appointmentType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "nurse_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private NurseEntity nurse;

    /**
     * Data/ora di inizio dell'appuntamento.
     */
    @Column(name = "start_datetime", nullable = false)
    private LocalDateTime startDateTime;

    /**
     * Data/ora di fine dell'appuntamento.
     */
    @Column(name = "end_datetime", nullable = false)
    private LocalDateTime endDateTime;

    /**
     * Tipo di ricorrenza: SINGLE, DAILY, WEEKLY, MONTHLY.
     */
    @Column(name = "recurrence_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private RecurrenceType recurrenceType;

    /**
     * Data fino a cui ricorre l'appuntamento (applicabile solo se recurrenceType != SINGLE).
     */
    @Column(name = "recurrence_end_date")
    private LocalDate recurrenceEndDate;

    /**
     * Abilita le notifiche/promemoria per questo appuntamento.
     */
    @Column(name = "reminder_enabled")
    @Builder.Default
    private Boolean reminderEnabled = false;

    /**
     * Minuti prima dell'appuntamento per inviare il promemoria.
     */
    @Column(name = "reminder_minutes_before")
    @Builder.Default
    private Integer reminderMinutesBefore = 15;

    /**
     * Stato dell'appuntamento: SCHEDULED, COMPLETED, CANCELLED.
     */
    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private String status = "SCHEDULED";

    /**
     * Note aggiuntive per l'appuntamento.
     */
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
