package com.qtm.tenants.doctor.repository;

import com.qtm.tenants.doctor.entity.DoctorEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository JPA dottori.
 */
public interface DoctorRepository extends JpaRepository<DoctorEntity, Long> {
}
