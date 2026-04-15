package com.qtm.tenants.equipment.controller;

import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.equipment.dto.EquipmentTypeDTO;
import com.qtm.tenants.equipment.service.EquipmentTypeService;
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
 * REST Controller per la gestione CRUD dei tipi di equipaggiamento.
 * Gestisce anche l'upload di due file JSON opzionali.
 */
@RestController
@RequestMapping("/api/tenants/equipment-types")
@RequiredArgsConstructor
public class EquipmentTypeController {
    private static final String MODULE_CODE = "EQUIPMENT_TYPE";

    private final EquipmentTypeService service;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @GetMapping
        public List<EquipmentTypeDTO> findAll(
                        @RequestParam(required = false) String code,
                        @RequestParam(required = false) String name,
                        @RequestParam(required = false) String status,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
                return service.findAll(code, name, status);
    }

    @GetMapping("/{id}")
        public EquipmentTypeDTO findByCode(
                        @PathVariable String id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
                return service.findByCode(id);
    }

        @PostMapping
    public EquipmentTypeDTO create(
                        @RequestBody EquipmentTypeDTO dto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return service.create(dto);
    }

        @PutMapping(value = "/{id}")
    public EquipmentTypeDTO update(
                        @PathVariable String id,
                        @RequestBody EquipmentTypeDTO dto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
                return service.updateByCode(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
                        @PathVariable String id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.DELETE_FUNCTION_CODE
        );
                service.deleteByCode(id);
        return ResponseEntity.noContent().build();
    }
}
