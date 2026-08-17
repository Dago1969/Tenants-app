package com.qtm.tenants.authorization.service;

import com.qtm.tenants.authorization.AuthorizationScope;
import com.qtm.tenants.authorization.ModuleRoleAuthorizationEntity;
import com.qtm.tenants.authorization.ModuleRoleAuthorizationRepository;
import com.qtm.tenants.authorization.entity.FunctionModuleRoleAuthorizationEntity;
import com.qtm.tenants.authorization.repository.FunctionModuleRoleAuthorizationRepository;
import com.qtm.tenants.controllerfunction.ControllerMethodFunctionService;
import com.qtm.tenants.role.entity.RoleEntity;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Test del service di autorizzazione controller con delega ai mapping persistenti modulo -> metodo -> funzione.
 */
class ControllerFunctionAuthorizationServiceTest {

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldDelegateSupportedFunctionsToControllerMethodFunctionService() {
        FunctionModuleRoleAuthorizationRepository functionRepository = mock(FunctionModuleRoleAuthorizationRepository.class);
        ModuleRoleAuthorizationRepository moduleRepository = mock(ModuleRoleAuthorizationRepository.class);
        ControllerMethodFunctionService controllerMethodFunctionService = mock(ControllerMethodFunctionService.class);
        when(controllerMethodFunctionService.getSupportedFunctionCodes("FUNCTION"))
                .thenReturn(List.of("CREATE", "SEARCH", "APPROVE"));

        ControllerFunctionAuthorizationService service = new ControllerFunctionAuthorizationService(
                functionRepository,
                moduleRepository,
                controllerMethodFunctionService
        );

        assertEquals(List.of("CREATE", "SEARCH", "APPROVE"), service.getSupportedFunctionCodes("FUNCTION"));
    }

    @Test
    void shouldDelegateCommonFunctionClassification() {
        FunctionModuleRoleAuthorizationRepository functionRepository = mock(FunctionModuleRoleAuthorizationRepository.class);
        ModuleRoleAuthorizationRepository moduleRepository = mock(ModuleRoleAuthorizationRepository.class);
        ControllerMethodFunctionService controllerMethodFunctionService = mock(ControllerMethodFunctionService.class);
        when(controllerMethodFunctionService.isCommonFunctionCode("CREATE")).thenReturn(true);
        when(controllerMethodFunctionService.isCommonFunctionCode("APPROVE")).thenReturn(false);

        ControllerFunctionAuthorizationService service = new ControllerFunctionAuthorizationService(
                functionRepository,
                moduleRepository,
                controllerMethodFunctionService
        );

        assertTrue(service.isCommonFunctionCode("CREATE"));
        assertFalse(service.isCommonFunctionCode("APPROVE"));
    }

    @Test
    void shouldResolveSelectedRoleFromRequestHeaderWhenMethodArgumentIsMissing() {
    FunctionModuleRoleAuthorizationRepository functionRepository = mock(FunctionModuleRoleAuthorizationRepository.class);
    ModuleRoleAuthorizationRepository moduleRepository = mock(ModuleRoleAuthorizationRepository.class);
    ControllerMethodFunctionService controllerMethodFunctionService = mock(ControllerMethodFunctionService.class);
    ControllerFunctionAuthorizationService service = new ControllerFunctionAuthorizationService(
        functionRepository,
        moduleRepository,
        controllerMethodFunctionService
    );

    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("X-Selected-Role", "SUPER_ADMIN");
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

    when(moduleRepository.findByModuleCodeAndRoleId("STRUCTURE-ASL", "SUPER_ADMIN"))
        .thenReturn(Optional.of(moduleAuthorization(AuthorizationScope.FULL_EDIT, "SUPER_ADMIN")));

    assertDoesNotThrow(() -> service.requireFullEditPermission(null, "STRUCTURE-ASL", "CREATE"));
    verify(functionRepository).findByRoleIdAndModuleCodeAndFunctionCode("SUPER_ADMIN", "STRUCTURE-ASL", "CREATE");
    }

    @Test
    void shouldResolveSelectedRoleFromJwtAuthoritiesWhenHeaderIsMissing() {
    FunctionModuleRoleAuthorizationRepository functionRepository = mock(FunctionModuleRoleAuthorizationRepository.class);
    ModuleRoleAuthorizationRepository moduleRepository = mock(ModuleRoleAuthorizationRepository.class);
    ControllerMethodFunctionService controllerMethodFunctionService = mock(ControllerMethodFunctionService.class);
    ControllerFunctionAuthorizationService service = new ControllerFunctionAuthorizationService(
        functionRepository,
        moduleRepository,
        controllerMethodFunctionService
    );

    Jwt jwt = Jwt.withTokenValue("token")
        .header("alg", "none")
        .claim("realm_access", Map.of("roles", List.of("SUPER_ADMIN")))
        .issuedAt(Instant.now())
        .expiresAt(Instant.now().plusSeconds(300))
        .build();
    SecurityContextHolder.getContext().setAuthentication(
        new UsernamePasswordAuthenticationToken(jwt, null, List.of())
    );

    when(moduleRepository.findByModuleCodeAndRoleId("STRUCTURE-ASL", "SUPER_ADMIN"))
        .thenReturn(Optional.of(moduleAuthorization(AuthorizationScope.FULL_EDIT, "SUPER_ADMIN")));

    assertDoesNotThrow(() -> service.requireFullEditPermission("", "STRUCTURE-ASL", "CREATE"));
    verify(functionRepository).findByRoleIdAndModuleCodeAndFunctionCode("SUPER_ADMIN", "STRUCTURE-ASL", "CREATE");
    }

    @Test
    void shouldRejectWhenResolvedRoleHasDeniedFunction() {
    FunctionModuleRoleAuthorizationRepository functionRepository = mock(FunctionModuleRoleAuthorizationRepository.class);
    ModuleRoleAuthorizationRepository moduleRepository = mock(ModuleRoleAuthorizationRepository.class);
    ControllerMethodFunctionService controllerMethodFunctionService = mock(ControllerMethodFunctionService.class);
    ControllerFunctionAuthorizationService service = new ControllerFunctionAuthorizationService(
        functionRepository,
        moduleRepository,
        controllerMethodFunctionService
    );

    when(moduleRepository.findByModuleCodeAndRoleId("STRUCTURE-ASL", "SUPER_ADMIN"))
        .thenReturn(Optional.of(moduleAuthorization(AuthorizationScope.FULL_EDIT, "SUPER_ADMIN")));
    when(functionRepository.findByRoleIdAndModuleCodeAndFunctionCode("SUPER_ADMIN", "STRUCTURE-ASL", "CREATE"))
        .thenReturn(Optional.of(functionAuthorization(AuthorizationScope.DENY)));

    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class,
        () -> service.requireFullEditPermission("SUPER_ADMIN", "STRUCTURE-ASL", "CREATE")
    );

    assertEquals(403, exception.getStatusCode().value());
    }

    @Test
    void shouldFailWhenNoRoleCanBeResolved() {
    FunctionModuleRoleAuthorizationRepository functionRepository = mock(FunctionModuleRoleAuthorizationRepository.class);
    ModuleRoleAuthorizationRepository moduleRepository = mock(ModuleRoleAuthorizationRepository.class);
    ControllerMethodFunctionService controllerMethodFunctionService = mock(ControllerMethodFunctionService.class);
    ControllerFunctionAuthorizationService service = new ControllerFunctionAuthorizationService(
        functionRepository,
        moduleRepository,
        controllerMethodFunctionService
    );

    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class,
        () -> service.requireModuleAccess(null, "STRUCTURE-ASL")
    );

    assertEquals(403, exception.getStatusCode().value());
    verify(moduleRepository, never()).findByModuleCodeAndRoleId(anyString(), anyString());
    }

    private ModuleRoleAuthorizationEntity moduleAuthorization(AuthorizationScope scope, String roleId) {
    RoleEntity role = new RoleEntity();
    role.setId(roleId);

    ModuleRoleAuthorizationEntity entity = new ModuleRoleAuthorizationEntity();
    entity.setAuthorization(scope);
    entity.setRole(role);
    return entity;
    }

    private FunctionModuleRoleAuthorizationEntity functionAuthorization(AuthorizationScope scope) {
    FunctionModuleRoleAuthorizationEntity entity = new FunctionModuleRoleAuthorizationEntity();
    entity.setAuthorization(scope);
    return entity;
    }
}
