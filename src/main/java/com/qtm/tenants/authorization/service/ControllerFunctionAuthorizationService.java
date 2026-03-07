package com.qtm.tenants.authorization.service;

import com.qtm.tenants.authorization.AuthorizationScope;
import com.qtm.tenants.authorization.ModuleRoleAuthorizationEntity;
import com.qtm.tenants.authorization.ModuleRoleAuthorizationRepository;
import com.qtm.tenants.authorization.entity.FunctionModuleRoleAuthorizationEntity;
import com.qtm.tenants.authorization.repository.FunctionModuleRoleAuthorizationRepository;
import com.qtm.tenants.controllerfunction.ControllerMethodFunctionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

import static org.springframework.http.HttpStatus.FORBIDDEN;

/**
 * Servizio centralizzato per verificare i permessi di modulo e funzione dei controller.
 */
@Service
@RequiredArgsConstructor
public class ControllerFunctionAuthorizationService {

    public static final String CREATE_FUNCTION_CODE = "CREATE";
    public static final String READ_FUNCTION_CODE = "READ";
    public static final String SEARCH_FUNCTION_CODE = "SEARCH";
    public static final String UPDATE_FUNCTION_CODE = "UPDATE";
    public static final String DELETE_FUNCTION_CODE = "DELETE";
    public static final String APPROVE_FUNCTION_CODE = "APPROVE";

    private final FunctionModuleRoleAuthorizationRepository functionModuleRoleAuthorizationRepository;
    private final ModuleRoleAuthorizationRepository moduleRoleAuthorizationRepository;
    private final ControllerMethodFunctionService controllerMethodFunctionService;

    /**
     * Risolve le funzioni visibili per il modulo leggendo i metodi del controller registrato.
     */
    public List<String> getSupportedFunctionCodes(String moduleCode) {
        return controllerMethodFunctionService.getSupportedFunctionCodes(moduleCode);
    }

    public boolean isCommonFunctionCode(String functionCode) {
        return controllerMethodFunctionService.isCommonFunctionCode(functionCode);
    }

    public void requireModuleAccess(String selectedRole, String moduleCode) {
        if (selectedRole == null || selectedRole.isBlank()) {
            throw new ResponseStatusException(FORBIDDEN, "Ruolo selezionato mancante");
        }

        AuthorizationScope resolvedScope = resolveModuleScope(selectedRole, moduleCode);
        if (!resolvedScope.allowsModuleAccess()) {
            throw new ResponseStatusException(
                    FORBIDDEN,
                    "Modulo non consentito per il ruolo selezionato: " + moduleCode
            );
        }
    }

    public void requireFunctionAccess(String selectedRole, String moduleCode, String functionCode) {
        requireModuleAccess(selectedRole, moduleCode);

        AuthorizationScope resolvedScope = functionModuleRoleAuthorizationRepository
                .findByRoleIdAndModuleCodeAndFunctionCode(selectedRole, moduleCode, functionCode)
                .map(FunctionModuleRoleAuthorizationEntity::getAuthorization)
                .orElseGet(() -> resolveModuleScope(selectedRole, moduleCode));

        if (!resolvedScope.allowsFunctionExecution()) {
            throw new ResponseStatusException(
                    FORBIDDEN,
                    "Operazione non consentita per il ruolo selezionato: " + moduleCode + "/" + functionCode
            );
        }
    }

    public void requireFullEditPermission(String selectedRole, String moduleCode, String functionCode) {
        requireFunctionAccess(selectedRole, moduleCode, functionCode);
    }

    private AuthorizationScope resolveModuleScope(String selectedRole, String moduleCode) {
        return moduleRoleAuthorizationRepository
                .findByModuleCodeAndRoleId(moduleCode, selectedRole)
                .map(ModuleRoleAuthorizationEntity::getAuthorization)
                .orElse(AuthorizationScope.ALLOW);
    }

}