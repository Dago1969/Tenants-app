package com.qtm.tenants.structure.controller;

import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.structure.dto.StructureTypeDto;
import com.qtm.tenants.structure.service.StructureTypeService;
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
 * Controller REST CRUD del catalogo tipi struttura.
 */
@RestController
@RequestMapping("/api/tenants/structure-types")
@RequiredArgsConstructor
public class StructureTypeController {

    private static final String MODULE_CODE = "STRUCTURE";

    private final StructureTypeService structureTypeService;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @GetMapping
    public ResponseEntity<List<StructureTypeDto>> findAll(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String description,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(structureTypeService.findAll(code, description));
    }

    @GetMapping("/{code}")
    public ResponseEntity<StructureTypeDto> findByCode(
            @PathVariable String code,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(structureTypeService.findByCode(code));
    }

    @PostMapping
    public ResponseEntity<StructureTypeDto> create(
            @RequestBody StructureTypeDto structureTypeDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(structureTypeService.create(structureTypeDto));
    }

    @PutMapping("/{code}")
    public ResponseEntity<StructureTypeDto> update(
            @PathVariable String code,
            @RequestBody StructureTypeDto structureTypeDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(structureTypeService.update(code, structureTypeDto));
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
        structureTypeService.delete(code);
        return ResponseEntity.noContent().build();
    }
}