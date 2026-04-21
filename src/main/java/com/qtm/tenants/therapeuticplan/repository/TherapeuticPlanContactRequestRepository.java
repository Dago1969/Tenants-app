package com.qtm.tenants.therapeuticplan.repository;

import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanContactRequestEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository JPA per le richieste contatto del piano terapeutico.
 */
@Repository
public interface TherapeuticPlanContactRequestRepository extends JpaRepository<TherapeuticPlanContactRequestEntity, Long> {

    @Override
    @EntityGraph(attributePaths = {"therapeuticPlan", "structure"})
    Optional<TherapeuticPlanContactRequestEntity> findById(Long id);

    @EntityGraph(attributePaths = {"therapeuticPlan", "structure"})
    @Query("""
        SELECT contactRequest
        FROM TherapeuticPlanContactRequestEntity contactRequest
        JOIN contactRequest.therapeuticPlan therapeuticPlan
        WHERE therapeuticPlan.id = :therapeuticPlanId
        ORDER BY contactRequest.requestDate DESC, contactRequest.id DESC
        """)
    List<TherapeuticPlanContactRequestEntity> findByTherapeuticPlanId(@Param("therapeuticPlanId") Long therapeuticPlanId);
}