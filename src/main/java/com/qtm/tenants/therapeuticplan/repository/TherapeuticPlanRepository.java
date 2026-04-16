package com.qtm.tenants.therapeuticplan.repository;

import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository JPA per TherapeuticPlanEntity.
 */
@Repository
public interface TherapeuticPlanRepository extends JpaRepository<TherapeuticPlanEntity, Long> {

    @Override
  @EntityGraph(attributePaths = {"structure", "nurse", "doctor", "equipments", "equipments.equipmentType"})
    Optional<TherapeuticPlanEntity> findById(Long id);

  @EntityGraph(attributePaths = {"structure", "nurse", "doctor", "equipments", "equipments.equipmentType"})
    @Query("""
        SELECT DISTINCT therapeuticPlan
        FROM TherapeuticPlanEntity therapeuticPlan
        JOIN therapeuticPlan.structure structure
        JOIN therapeuticPlan.nurse nurse
        JOIN therapeuticPlan.doctor doctor
        LEFT JOIN therapeuticPlan.equipments equipment
    WHERE (:projectCode = '' OR LOWER(COALESCE(therapeuticPlan.projectCode, '')) LIKE LOWER(CONCAT('%', :projectCode, '%')))
          AND (:status = '' OR LOWER(COALESCE(therapeuticPlan.status, '')) = LOWER(:status))
          AND (:drugCode = '' OR LOWER(COALESCE(therapeuticPlan.drugCode, '')) LIKE LOWER(CONCAT('%', :drugCode, '%')))
        ORDER BY therapeuticPlan.startDate DESC, therapeuticPlan.id DESC
        """)
    List<TherapeuticPlanEntity> searchByFilters(
            @Param("projectCode") String projectCode,
            @Param("status") String status,
            @Param("drugCode") String drugCode
    );
}