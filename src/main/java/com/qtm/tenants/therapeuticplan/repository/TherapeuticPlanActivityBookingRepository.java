package com.qtm.tenants.therapeuticplan.repository;

import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanActivityBookingEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository JPA per le prenotazioni attivita del piano terapeutico.
 */
@Repository
public interface TherapeuticPlanActivityBookingRepository extends JpaRepository<TherapeuticPlanActivityBookingEntity, Long> {

    @Override
    @EntityGraph(attributePaths = {"therapeuticPlan", "structure"})
    Optional<TherapeuticPlanActivityBookingEntity> findById(Long id);

    @EntityGraph(attributePaths = {"therapeuticPlan", "structure"})
    @Query("""
        SELECT booking
        FROM TherapeuticPlanActivityBookingEntity booking
        JOIN booking.therapeuticPlan therapeuticPlan
        WHERE therapeuticPlan.id = :therapeuticPlanId
        ORDER BY booking.bookingDate DESC, booking.id DESC
        """)
    List<TherapeuticPlanActivityBookingEntity> findByTherapeuticPlanId(@Param("therapeuticPlanId") Long therapeuticPlanId);
}