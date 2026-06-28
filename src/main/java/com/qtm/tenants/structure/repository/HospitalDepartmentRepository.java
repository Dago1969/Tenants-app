package com.qtm.tenants.structure.repository;

import com.qtm.tenants.structure.entity.HospitalDepartmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository JPA per le associazioni struttura ospedaliera - dipartimento.
 */
@Repository
public interface HospitalDepartmentRepository extends JpaRepository<HospitalDepartmentEntity, Long> {

    List<HospitalDepartmentEntity> findAllByStructureIdOrderByDepartmentIdAsc(Long structureId);

    Optional<HospitalDepartmentEntity> findByStructureIdAndDepartmentId(Long structureId, Long departmentId);

    void deleteAllByStructureId(Long structureId);
}
