package com.qtm.tenants.therapeuticplan.repository;

import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanVisitEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanVisitId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TherapeuticPlanVisitRepository extends JpaRepository<TherapeuticPlanVisitEntity, TherapeuticPlanVisitId> {
    List<TherapeuticPlanVisitEntity> findByTherapeuticPlanId(Long therapeuticPlanId);

    List<TherapeuticPlanVisitEntity> findByTherapeuticPlanIdAndStatus(Long therapeuticPlanId, String status);

    @Modifying
    void deleteByTherapeuticPlanIdAndStatus(Long therapeuticPlanId, String status);

    List<TherapeuticPlanVisitEntity> findByStatusAndDateBetween(String status, LocalDateTime start, LocalDateTime end);
}
