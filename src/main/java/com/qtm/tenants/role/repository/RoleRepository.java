package com.qtm.tenants.role.repository;

import com.qtm.tenants.role.entity.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository JPA dei ruoli.
 */
public interface RoleRepository extends JpaRepository<RoleEntity, String> {
}
