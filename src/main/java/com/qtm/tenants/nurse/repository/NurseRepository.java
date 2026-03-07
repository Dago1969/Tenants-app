package com.qtm.tenants.nurse.repository;

import com.qtm.tenants.nurse.entity.NurseEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository JPA infermieri.
 */
public interface NurseRepository extends JpaRepository<NurseEntity, Long> {
}
