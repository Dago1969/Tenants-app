package com.qtm.tenants.role.controller;

import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.role.dto.RoleDto;
import com.qtm.tenants.role.service.RoleService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller REST CRUD ruoli.
 */
@RestController
@RequestMapping("/api/tenants/roles")
@RequiredArgsConstructor
public class RoleController {

    private static final String MODULE_CODE = "ROLE";

    private final RoleService roleService;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @PostMapping
    public ResponseEntity<RoleDto> create(
            @RequestBody RoleDto roleDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(roleService.create(roleDto));
    }

    @GetMapping
    public ResponseEntity<List<RoleDto>> findAll(
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(roleService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoleDto> findById(
            @PathVariable String id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(roleService.findById(id));
    }

        @GetMapping("/delete-check/{id}")
        public ResponseEntity<com.qtm.tenants.role.dto.RoleDeleteCheckDto> getDeleteCheck(
                        @PathVariable String id,
                        @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
        ) {
                controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
                return ResponseEntity.ok(roleService.getDeleteCheck(id));
        }

    @PutMapping("/{id}")
    public ResponseEntity<RoleDto> update(
            @PathVariable String id,
            @RequestBody RoleDto roleDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(roleService.update(id, roleDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable String id,
            @RequestParam(required = false) String replacementRoleId,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.DELETE_FUNCTION_CODE
        );
                roleService.delete(id, replacementRoleId);
        return ResponseEntity.noContent().build();
    }
}