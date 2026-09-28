package com.qtm.tenants.nurse.repository;

import com.qtm.tenants.nurse.entity.NurseEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository JPA infermieri.
 */
public interface NurseRepository extends JpaRepository<NurseEntity, Long> {
	Optional<NurseEntity> findByUseridOrEmail(String userid, String email);
}
