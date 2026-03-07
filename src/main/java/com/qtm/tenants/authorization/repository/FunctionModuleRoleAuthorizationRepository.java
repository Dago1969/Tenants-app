package com.qtm.tenants.authorization.repository;

import com.qtm.tenants.authorization.entity.FunctionModuleRoleAuthorizationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository JPA per autorizzazioni funzioni-modulo-ruolo.
 */
public interface FunctionModuleRoleAuthorizationRepository extends JpaRepository<FunctionModuleRoleAuthorizationEntity, Long> {
    List<FunctionModuleRoleAuthorizationEntity> findAllByRoleId(String roleId);

    List<FunctionModuleRoleAuthorizationEntity> findAllByRoleIdAndModuleCode(String roleId, String moduleCode);

    Optional<FunctionModuleRoleAuthorizationEntity> findByRoleIdAndModuleCodeAndFunctionCode(
            String roleId,
            String moduleCode,
            String functionCode
    );
}
