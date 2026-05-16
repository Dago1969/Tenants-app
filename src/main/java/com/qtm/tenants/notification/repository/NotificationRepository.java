package com.qtm.tenants.notification.repository;

import com.qtm.tenants.notification.entity.NotificationEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository JPA per NotificationEntity.
 */
@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    @Override
    @EntityGraph(attributePaths = {"therapeuticPlan", "therapeuticPlan.doctorAssignments", "therapeuticPlan.doctorAssignments.doctor"})
    Optional<NotificationEntity> findById(Long id);

    @EntityGraph(attributePaths = {"therapeuticPlan", "therapeuticPlan.doctorAssignments", "therapeuticPlan.doctorAssignments.doctor"})
    @Query("""
        SELECT notification
        FROM NotificationEntity notification
        JOIN notification.therapeuticPlan therapeuticPlan
        WHERE (:therapeuticPlanId IS NULL OR therapeuticPlan.id = :therapeuticPlanId)
        ORDER BY notification.sentDate DESC, notification.id DESC
        """)
    List<NotificationEntity> searchByTherapeuticPlanId(@Param("therapeuticPlanId") Long therapeuticPlanId);

    void deleteByTherapeuticPlan_Id(Long therapeuticPlanId);
}