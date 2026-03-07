package com.qtm.tenants.medic.repository;

import com.qtm.tenants.medic.entity.MedicEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository JPA medici.
 */
public interface MedicRepository extends JpaRepository<MedicEntity, Long> {
}
