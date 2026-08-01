package com.qtm.tenants.structure.repository;

import com.qtm.tenants.structure.entity.HospitalDepartmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HospitalDepartmentRepository extends JpaRepository<HospitalDepartmentEntity, Long> {
	java.util.List<HospitalDepartmentEntity> findAllByStructureIdOrderByDepartmentIdAsc(Long structureId);
	void deleteAllByStructureId(Long structureId);
}
