package com.qtm.tenants.therapeuticplan.repository;

import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanNurseAssignmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository JPA per le relazioni piano terapeutico-infermiera.
 */
@Repository
public interface TherapeuticPlanNurseAssignmentRepository extends JpaRepository<TherapeuticPlanNurseAssignmentEntity, Long> {

    /**
     * Elimina tutte le relazioni piano-infermiera per una data infermiera.
     * Utilizzato quando si elimina un utente per pulire le relazioni relative all'infermiera associata.
     * 
     * @param nurseId ID dell'infermiera
     * @return numero di record eliminati
     */
    long deleteByNurseId(Long nurseId);
}
