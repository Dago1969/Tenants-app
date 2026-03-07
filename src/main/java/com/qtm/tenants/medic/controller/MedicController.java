package com.qtm.tenants.medic.controller;

import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.function.dto.FunctionDto;
import com.qtm.tenants.medic.dto.MedicDto;
import com.qtm.tenants.medic.service.MedicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Controller REST CRUD medici.
 */
@RestController
@RequestMapping("/api/tenants/medics")
@RequiredArgsConstructor
public class MedicController {

    private static final String MODULE_CODE = "MEDIC";

    private final MedicService medicService;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @PostMapping
    public ResponseEntity<MedicDto> create(
            @RequestBody MedicDto medicDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(medicService.create(medicDto));
    }

    /**
     * Azione specifica del modulo FUNCTION usata dalla matrice autorizzazioni per la funzione APPROVE.
     */
    @PostMapping("/{code}/approve")
    public ResponseEntity<MedicDto> approve(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
            selectedRole,
            MODULE_CODE,
            ControllerFunctionAuthorizationService.APPROVE_FUNCTION_CODE
        );
        return ResponseEntity.ok(medicService.findById(id));
    }

        @PostMapping("/test/{code}")
    public ResponseEntity<MedicDto> test(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
            selectedRole,
            MODULE_CODE,
            ControllerFunctionAuthorizationService.APPROVE_FUNCTION_CODE
        );
        return ResponseEntity.ok(medicService.findById(id));
    }

    @GetMapping
    public ResponseEntity<List<MedicDto>> findAll(
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(medicService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicDto> findById(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(medicService.findById(id));
    }

    @GetMapping("/permissions")
    public ResponseEntity<Map<String, String>> getFieldPermissions(
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(medicService.getFieldAuthorizationsForCurrentRole());
    }

    @PutMapping("/{id}")
    public ResponseEntity<MedicDto> update(
            @PathVariable Long id,
            @RequestBody MedicDto medicDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(medicService.update(id, medicDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.DELETE_FUNCTION_CODE
        );
        medicService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
