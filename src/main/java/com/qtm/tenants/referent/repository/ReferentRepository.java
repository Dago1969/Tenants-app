package com.qtm.tenants.referent.repository;

import com.qtm.tenants.referent.entity.ReferentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository JPA per ReferentEntity.
 */
@Repository
public interface ReferentRepository extends JpaRepository<ReferentEntity, Long> {
}
