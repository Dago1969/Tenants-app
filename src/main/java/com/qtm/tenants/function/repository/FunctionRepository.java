package com.qtm.tenants.function.repository;

import com.qtm.tenants.function.entity.FunctionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository JPA funzioni tenant.
 */
public interface FunctionRepository extends JpaRepository<FunctionEntity, String> {
}
