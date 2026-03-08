package com.qtm.tenants.authorization;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository permessi per singolo campo.
 */
public interface FieldAuthorizationRepository extends JpaRepository<FieldAuthorizationEntity, Long> {

    List<FieldAuthorizationEntity> findAllByModuleRoleAuthorizationModuleCodeAndModuleRoleAuthorizationRoleIdAndEntityName(
            String moduleCode,
            String roleId,
            String entityName
    );

        List<FieldAuthorizationEntity> findAllByModuleRoleAuthorizationAndEntityName(
            ModuleRoleAuthorizationEntity moduleRoleAuthorization,
            String entityName
        );

    void deleteAllByModuleRoleAuthorizationRoleId(String roleId);
}
