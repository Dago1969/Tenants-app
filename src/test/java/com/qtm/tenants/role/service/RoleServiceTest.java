
package com.qtm.tenants.role.service;
import com.qtm.tenants.user.service.UserRemoteService;

import com.qtm.tenants.role.dto.RoleDto;
import com.qtm.tenants.role.entity.RoleEntity;
import com.qtm.tenants.role.mapper.RoleMapper;
import com.qtm.tenants.role.repository.RoleRepository;
import com.qtm.tenants.authorization.AuthorizationManagementService;
import com.qtm.tenants.authorization.ModuleRoleAuthorizationRepository;
import com.qtm.tenants.authorization.FieldAuthorizationRepository;
import com.qtm.tenants.authorization.repository.FunctionModuleRoleAuthorizationRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Test del service ruoli: verifica conversione dto/entity e operazioni CRUD principali.
 */
@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock
    private RoleRepository roleRepository;
    @Mock
    private RoleMapper roleMapper;
    @Mock
    private AuthorizationManagementService authorizationManagementService;
    @Mock
    private ModuleRoleAuthorizationRepository moduleRoleAuthorizationRepository;
    @Mock
    private FieldAuthorizationRepository fieldAuthorizationRepository;
    @Mock
    private FunctionModuleRoleAuthorizationRepository functionModuleRoleAuthorizationRepository;
    @Mock
    private UserRemoteService userRemoteService;

    private RoleService roleService;

    @BeforeEach
    void setUp() {
        roleService = new RoleService(
            roleRepository,
            roleMapper,
            authorizationManagementService,
            moduleRoleAuthorizationRepository,
            fieldAuthorizationRepository,
            functionModuleRoleAuthorizationRepository,
            userRemoteService
        );
    }

    @Test
    void shouldCreateAndReadRole() {
        RoleEntity saved = new RoleEntity();
        saved.setId("ADMIN");
        saved.setDescription("Amministratore");

        when(roleRepository.save(any(RoleEntity.class))).thenReturn(saved);
        when(roleRepository.findById("ADMIN")).thenReturn(Optional.of(saved));
        when(roleRepository.findAll()).thenReturn(List.of(saved));

        RoleDto toCreate = new RoleDto();
        toCreate.setId("ADMIN");
        toCreate.setDescription("Amministratore");

        RoleDto created = roleService.create(toCreate);
        RoleDto loaded = roleService.findById("ADMIN");

        assertThat(created.getId()).isEqualTo("ADMIN");
        assertThat(loaded.getId()).isEqualTo("ADMIN");
        assertThat(roleService.findAll()).hasSize(1);
    }
}
