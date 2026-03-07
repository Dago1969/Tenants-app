package com.qtm.tenants.patient.repository;

import com.qtm.tenants.patient.entity.PatientEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository pazienti.
 */
public interface PatientRepository extends JpaRepository<PatientEntity, Long> {
}
