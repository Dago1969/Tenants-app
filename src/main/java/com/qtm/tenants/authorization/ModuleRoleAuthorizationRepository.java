package com.qtm.tenants.authorization;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository autorizzazioni aggregate modulo+ruolo.
 */
public interface ModuleRoleAuthorizationRepository extends JpaRepository<ModuleRoleAuthorizationEntity, Long> {

    Optional<ModuleRoleAuthorizationEntity> findByModuleCodeAndRoleId(String moduleCode, String roleId);

    List<ModuleRoleAuthorizationEntity> findAllByRoleId(String roleId);

    void deleteAllByRoleId(String roleId);
}
