package com.qtm.tenants.alert.repository;

import com.qtm.tenants.alert.entity.AlertEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository JPA per AlertEntity.
 */
@Repository
public interface AlertRepository extends JpaRepository<AlertEntity, Long> {

    @Override
    @EntityGraph(attributePaths = {"therapeuticPlan", "doctor"})
    Optional<AlertEntity> findById(Long id);

    @EntityGraph(attributePaths = {"therapeuticPlan", "doctor"})
    @Query("""
        SELECT alert
        FROM AlertEntity alert
        JOIN alert.therapeuticPlan therapeuticPlan
        JOIN alert.doctor doctor
        WHERE (:therapeuticPlanId IS NULL OR therapeuticPlan.id = :therapeuticPlanId)
          AND (:doctorId IS NULL OR doctor.id = :doctorId)
        ORDER BY alert.alertDate DESC, alert.id DESC
        """)
    List<AlertEntity> searchByFilters(
            @Param("therapeuticPlanId") Long therapeuticPlanId,
            @Param("doctorId") Long doctorId
    );

    void deleteByTherapeuticPlan_Id(Long therapeuticPlanId);
}