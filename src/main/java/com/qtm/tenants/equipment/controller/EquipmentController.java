package com.qtm.tenants.equipment.controller;

import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.equipment.dto.EquipmentDTO;
import com.qtm.tenants.equipment.service.EquipmentService;
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
 * REST controller per la gestione CRUD delle attrezzature censite a sistema.
 */
@RestController
@RequestMapping("/api/tenants/equipment")
@RequiredArgsConstructor
public class EquipmentController {

    private static final String MODULE_CODE = "EQUIPMENT";

    private final EquipmentService equipmentService;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @GetMapping
    public List<EquipmentDTO> findAll(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) Long equipmentTypeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String serialNumber,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return equipmentService.findAll(code, equipmentTypeId, status, serialNumber);
    }

    @GetMapping("/{id}")
    public EquipmentDTO findById(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return equipmentService.findById(id);
    }

    @PostMapping
    public EquipmentDTO create(
            @RequestBody EquipmentDTO dto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return equipmentService.create(dto);
    }

    @PutMapping("/{id}")
    public EquipmentDTO update(
            @PathVariable Long id,
            @RequestBody EquipmentDTO dto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        return equipmentService.update(id, dto);
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
        equipmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}