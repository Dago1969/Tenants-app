package com.qtm.tenants.module.repository;

import com.qtm.tenants.module.entity.ModuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository moduli.
 */
public interface ModuleRepository extends JpaRepository<ModuleEntity, String> {
}
