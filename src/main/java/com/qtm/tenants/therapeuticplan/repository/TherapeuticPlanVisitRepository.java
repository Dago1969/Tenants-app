package com.qtm.tenants.therapeuticplan.repository;

import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanVisitEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanVisitId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TherapeuticPlanVisitRepository extends JpaRepository<TherapeuticPlanVisitEntity, TherapeuticPlanVisitId> {
    List<TherapeuticPlanVisitEntity> findByTherapeuticPlanId(Long therapeuticPlanId);
}
