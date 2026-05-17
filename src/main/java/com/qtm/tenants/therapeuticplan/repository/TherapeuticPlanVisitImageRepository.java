package com.qtm.tenants.therapeuticplan.repository;

import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanVisitImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository per gestire le immagini associate alle visite del piano terapeutico.
 */
@Repository
public interface TherapeuticPlanVisitImageRepository extends JpaRepository<TherapeuticPlanVisitImageEntity, Long> {

    /**
     * Trova tutte le immagini associate a una visita specifica.
     *
     * @param therapeuticPlanId ID del piano terapeutico
     * @param visitDate data della visita
     * @return lista di immagini per la visita
     */
    List<TherapeuticPlanVisitImageEntity> findByTherapeuticPlanIdAndVisitDate(Long therapeuticPlanId, LocalDateTime visitDate);

    /**
     * Conta il numero di immagini associate a una visita.
     *
     * @param therapeuticPlanId ID del piano terapeutico
     * @param visitDate data della visita
     * @return numero di immagini
     */
    long countByTherapeuticPlanIdAndVisitDate(Long therapeuticPlanId, LocalDateTime visitDate);

    /**
     * Elimina tutte le immagini associate a una visita.
     *
     * @param therapeuticPlanId ID del piano terapeutico
     * @param visitDate data della visita
     */
    void deleteByTherapeuticPlanIdAndVisitDate(Long therapeuticPlanId, LocalDateTime visitDate);
}
