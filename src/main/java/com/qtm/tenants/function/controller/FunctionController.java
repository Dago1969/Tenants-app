package com.qtm.tenants.function.controller;

import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.function.dto.FunctionDto;
import com.qtm.tenants.function.service.FunctionService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller REST CRUD funzioni.
 */
@RestController
@RequestMapping("/api/tenants/functions")
@RequiredArgsConstructor
public class FunctionController {

    private static final String MODULE_CODE = "FUNCTION";

    private final FunctionService functionService;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @PostMapping
    public ResponseEntity<FunctionDto> create(
            @RequestBody FunctionDto functionDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
            selectedRole,
            MODULE_CODE,
            ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(functionService.create(functionDto));
    }

    @GetMapping
    public ResponseEntity<List<FunctionDto>> findAll(
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(functionService.findAll());
    }

    /**
     * Azione specifica del modulo FUNCTION usata dalla matrice autorizzazioni per la funzione APPROVE.
     */
    @PostMapping("/{code}/approve")
    public ResponseEntity<FunctionDto> approve(
            @PathVariable String code,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
            selectedRole,
            MODULE_CODE,
            ControllerFunctionAuthorizationService.APPROVE_FUNCTION_CODE
        );
        return ResponseEntity.ok(functionService.findByCode(code));
    }

    @GetMapping("/{code}")
    public ResponseEntity<FunctionDto> findByCode(
            @PathVariable String code,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(functionService.findByCode(code));
    }

    @PutMapping("/{code}")
    public ResponseEntity<FunctionDto> update(
            @PathVariable String code,
            @RequestBody FunctionDto functionDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
            selectedRole,
            MODULE_CODE,
            ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(functionService.update(code, functionDto));
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Void> delete(
            @PathVariable String code,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
            selectedRole,
            MODULE_CODE,
            ControllerFunctionAuthorizationService.DELETE_FUNCTION_CODE
        );
        functionService.delete(code);
        return ResponseEntity.noContent().build();
    }
}
