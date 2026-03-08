package com.qtm.tenants.structure.controller;

import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.structure.dto.StructureDto;
import com.qtm.tenants.structure.dto.StructureParentOptionDto;
import com.qtm.tenants.structure.dto.StructureTypeDto;
import com.qtm.tenants.structure.service.StructureService;
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
 * Controller REST CRUD strutture.
 */
@RestController
@RequestMapping("/api/tenants/structures")
@RequiredArgsConstructor
public class StructureController {

    private static final String MODULE_CODE = "STRUCTURE";

    private final StructureService structureService;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @PostMapping
    public ResponseEntity<StructureDto> create(
            @RequestBody StructureDto structureDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(structureService.create(structureDto));
    }

    @GetMapping
    public ResponseEntity<List<StructureDto>> findAll(
            @RequestParam(required = false) String structureType,
            @RequestParam(required = false) Long parentStructureId,
                        @RequestParam(required = false) String code,
                        @RequestParam(required = false) String name,
                        @RequestParam(required = false) String city,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
                return ResponseEntity.ok(structureService.findAll(structureType, parentStructureId, code, name, city));
    }

    @GetMapping("/types")
    public ResponseEntity<List<StructureTypeDto>> findTypes(
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(structureService.findSupportedTypes());
    }

    @GetMapping("/parent-options")
    public ResponseEntity<List<StructureParentOptionDto>> findParentOptions(
            @RequestParam String structureType,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(structureService.findParentOptions(structureType));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StructureDto> findById(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(structureService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StructureDto> update(
            @PathVariable Long id,
            @RequestBody StructureDto structureDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(structureService.update(id, structureDto));
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
        structureService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
