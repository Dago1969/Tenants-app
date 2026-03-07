package com.qtm.tenants.nurse.controller;

import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.nurse.dto.NurseDto;
import com.qtm.tenants.nurse.service.NurseService;
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
 * Controller REST CRUD infermieri.
 */
@RestController
@RequestMapping("/api/tenants/nurses")
@RequiredArgsConstructor
public class NurseController {

    private static final String MODULE_CODE = "NURSE";

    private final NurseService nurseService;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @PostMapping
    public ResponseEntity<NurseDto> create(
            @RequestBody NurseDto nurseDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(nurseService.create(nurseDto));
    }

    @GetMapping
    public ResponseEntity<List<NurseDto>> findAll(
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(nurseService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NurseDto> findById(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(nurseService.findById(id));
    }

    @GetMapping("/permissions")
    public ResponseEntity<Map<String, String>> getFieldPermissions(
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(nurseService.getFieldAuthorizationsForCurrentRole());
    }

    @PutMapping("/{id}")
    public ResponseEntity<NurseDto> update(
            @PathVariable Long id,
            @RequestBody NurseDto nurseDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(nurseService.update(id, nurseDto));
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
        nurseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
