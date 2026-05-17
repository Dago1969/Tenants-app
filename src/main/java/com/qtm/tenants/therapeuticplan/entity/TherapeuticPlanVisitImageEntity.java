package com.qtm.tenants.therapeuticplan.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinColumns;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity che rappresenta un'immagine associata a una visita del piano terapeutico.
 * Chiave esterna composta: therapeuticPlanId + visitDate per referenziare TherapeuticPlanVisitEntity
 */
@Entity
@Table(name = "therapeutic_plan_visit_image")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TherapeuticPlanVisitImageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "therapeutic_plan_id", nullable = false)
    private Long therapeuticPlanId;

    @Column(name = "visit_date", nullable = false)
    private LocalDateTime visitDate;

    @Column(name = "image_name", nullable = false, length = 255)
    private String imageName;

    @Column(name = "image_type", nullable = false, length = 100)
    private String imageType;

    @Lob
    @Column(name = "image_data", nullable = false, columnDefinition = "longblob")
    private byte[] imageData;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "upload_date", nullable = false)
    private LocalDateTime uploadDate;

    @ManyToOne
    @JoinColumns({
        @JoinColumn(name = "therapeutic_plan_id", referencedColumnName = "therapeutic_plan_id", insertable = false, updatable = false),
        @JoinColumn(name = "visit_date", referencedColumnName = "visit_date", insertable = false, updatable = false)
    })
    private TherapeuticPlanVisitEntity visit;
}
