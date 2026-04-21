package com.qtm.tenants.therapeuticplan.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity che rappresenta una visita associata a un piano terapeutico.
 * Chiave composta: therapeuticPlanId + dateTime visita
 */
@Entity
@Table(name = "therapeutic_plan_visit")
@IdClass(TherapeuticPlanVisitId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TherapeuticPlanVisitEntity {

    @Id
    @Column(name = "therapeutic_plan_id", nullable = false)
    private Long therapeuticPlanId;

    @Id
    @Column(name = "visit_date", nullable = false)
    private LocalDateTime date;

    @Column(name = "duodopa", length = 64)
    private String duodopa;

    @Column(name = "caregiver", length = 255)
    private String caregiver;

    @Column(name = "clinical_center", length = 255)
    private String clinicalCenter;

    @Column(name = "neurologist", length = 255)
    private String neurologist;

    @Column(name = "gastroenterologist", length = 255)
    private String gastroenterologist;

    @Column(name = "visit_type", length = 64)
    private String type;

    @Column(name = "visit_priority", length = 32)
    private String priority;

    @Lob
    @Column(name = "json_visit", columnDefinition = "text")
    private String jsonVisit;
}
