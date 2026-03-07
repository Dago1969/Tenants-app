package com.qtm.tenants.authorization;

import com.qtm.tenants.authorization.dto.AuthorizationFunctionDto;
import com.qtm.tenants.authorization.dto.AuthorizationModuleDto;
import com.qtm.tenants.authorization.dto.AuthorizationUpdateRequestDto;
import com.qtm.tenants.authorization.entity.FunctionModuleRoleAuthorizationEntity;
import com.qtm.tenants.authorization.repository.FunctionModuleRoleAuthorizationRepository;
import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.function.entity.FunctionEntity;
import com.qtm.tenants.function.repository.FunctionRepository;
import com.qtm.tenants.module.entity.ModuleEntity;
import com.qtm.tenants.module.repository.ModuleRepository;
import com.qtm.tenants.role.entity.RoleEntity;
import com.qtm.tenants.role.repository.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Test del service autorizzazioni: verifica che gli scope funzione allow/deny
 * vengano persistiti usando valori compatibili con lo schema database corrente.
 */
@ExtendWith(MockitoExtension.class)
class AuthorizationManagementServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private FunctionRepository functionRepository;

    @Mock
    private ModuleRepository moduleRepository;

    @Mock
    private ModuleRoleAuthorizationRepository moduleRoleAuthorizationRepository;

    @Mock
    private FieldAuthorizationRepository fieldAuthorizationRepository;

    @Mock
    private FunctionModuleRoleAuthorizationRepository functionModuleRoleAuthorizationRepository;

    @Mock
    private ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    private AuthorizationManagementService service;

    @BeforeEach
    void setUp() {
        service = new AuthorizationManagementService(
                roleRepository,
                functionRepository,
                moduleRepository,
                moduleRoleAuthorizationRepository,
                fieldAuthorizationRepository,
                functionModuleRoleAuthorizationRepository,
                controllerFunctionAuthorizationService
        );
    }

    @Test
    void shouldPersistFunctionScopesUsingDatabaseCompatibleValues() {
        RoleEntity role = new RoleEntity();
        role.setId("SUPER_ADMIN");
        role.setDescription("Super Admin");

        FunctionEntity createFunction = new FunctionEntity();
        createFunction.setCode("CREATE");
        createFunction.setName("Create");

        FunctionEntity readFunction = new FunctionEntity();
        readFunction.setCode("READ");
        readFunction.setName("Read");

        Map<String, ModuleEntity> modulesByCode = new HashMap<>();
        Map<String, ModuleRoleAuthorizationEntity> moduleAuthorizationsByCode = new HashMap<>();
        List<FunctionModuleRoleAuthorizationEntity> savedFunctionAuthorizations = new ArrayList<>();

        when(roleRepository.findById("SUPER_ADMIN")).thenReturn(Optional.of(role));
        when(functionRepository.findAll()).thenReturn(List.of(createFunction, readFunction));
        when(moduleRepository.findById(anyString())).thenAnswer(invocation -> {
            String moduleCode = invocation.getArgument(0, String.class);
            ModuleEntity module = modulesByCode.computeIfAbsent(moduleCode, code -> {
                ModuleEntity created = new ModuleEntity();
                created.setCode(code);
                created.setName(code);
                return created;
            });
            return Optional.of(module);
        });
        when(moduleRoleAuthorizationRepository.findByModuleCodeAndRoleId(anyString(), eq("SUPER_ADMIN")))
                .thenAnswer(invocation -> Optional.ofNullable(moduleAuthorizationsByCode.get(invocation.getArgument(0, String.class))));
        when(moduleRoleAuthorizationRepository.save(any(ModuleRoleAuthorizationEntity.class))).thenAnswer(invocation -> {
            ModuleRoleAuthorizationEntity entity = invocation.getArgument(0);
            moduleAuthorizationsByCode.put(entity.getModule().getCode(), entity);
            return entity;
        });
        when(fieldAuthorizationRepository.findAllByModuleRoleAuthorizationAndEntityName(any(ModuleRoleAuthorizationEntity.class), anyString()))
                .thenReturn(List.of());
        when(controllerFunctionAuthorizationService.getSupportedFunctionCodes(anyString())).thenAnswer(invocation ->
                "PATIENT".equals(invocation.getArgument(0, String.class)) ? List.of("CREATE", "READ") : List.of());
        when(controllerFunctionAuthorizationService.isCommonFunctionCode(anyString())).thenReturn(true);
        when(functionModuleRoleAuthorizationRepository.findByRoleIdAndModuleCodeAndFunctionCode(anyString(), anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(functionModuleRoleAuthorizationRepository.save(any(FunctionModuleRoleAuthorizationEntity.class))).thenAnswer(invocation -> {
            FunctionModuleRoleAuthorizationEntity entity = invocation.getArgument(0);
            savedFunctionAuthorizations.removeIf(current -> current.getFunction().getCode().equals(entity.getFunction().getCode())
                    && current.getModule().getCode().equals(entity.getModule().getCode())
                    && current.getRole().getId().equals(entity.getRole().getId()));
            savedFunctionAuthorizations.add(entity);
            return entity;
        });
        when(functionModuleRoleAuthorizationRepository.findAllByRoleIdAndModuleCode(anyString(), anyString())).thenAnswer(invocation -> {
            String roleId = invocation.getArgument(0, String.class);
            String moduleCode = invocation.getArgument(1, String.class);
            return savedFunctionAuthorizations.stream()
                    .filter(entity -> roleId.equals(entity.getRole().getId()) && moduleCode.equals(entity.getModule().getCode()))
                    .toList();
        });

        AuthorizationUpdateRequestDto request = new AuthorizationUpdateRequestDto();
        request.setModules(List.of(new AuthorizationModuleDto(
                "PATIENT",
                "Pazienti",
                "patient",
                "allow",
                List.of(),
                List.of(
                        new AuthorizationFunctionDto("CREATE", "Create", "allow", true),
                        new AuthorizationFunctionDto("READ", "Read", "deny", true)
                )
        )));

        service.updateRoleMatrix("SUPER_ADMIN", request);

        assertThat(savedFunctionAuthorizations)
                .extracting(entity -> entity.getFunction().getCode(), FunctionModuleRoleAuthorizationEntity::getAuthorization)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple("CREATE", AuthorizationScope.FULL_EDIT),
                        org.assertj.core.groups.Tuple.tuple("READ", AuthorizationScope.READ_ONLY)
                );
    }
}