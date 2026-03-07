package com.qtm.tenants.authorization.service;

import com.qtm.tenants.authorization.ModuleRoleAuthorizationRepository;
import com.qtm.tenants.authorization.repository.FunctionModuleRoleAuthorizationRepository;
import com.qtm.tenants.controllerfunction.ControllerMethodFunctionService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Test del service di autorizzazione controller con delega ai mapping persistenti modulo -> metodo -> funzione.
 */
class ControllerFunctionAuthorizationServiceTest {

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
}
