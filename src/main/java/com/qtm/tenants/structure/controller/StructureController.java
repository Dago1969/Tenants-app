package com.qtm.tenants.structure.controller;

import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.structure.StructureModuleCodes;
import com.qtm.tenants.structure.dto.StructureDepartmentOptionDto;
import com.qtm.tenants.structure.dto.StructureDto;
import com.qtm.tenants.structure.dto.StructureParentOptionDto;
import com.qtm.tenants.structure.dto.StructureTypeDto;
import com.qtm.tenants.structure.service.StructureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import lombok.extern.slf4j.Slf4j;
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
import java.util.Objects;

/**
 * Controller REST CRUD strutture.
 */
/**
 * Controller REST CRUD strutture.
 * La chiamata GET /api/tenants/structures invoca il metodo findAll con tutti i parametri, incluso active.
 */
@Slf4j
@RestController
@RequestMapping("/api/tenants/structures")
@RequiredArgsConstructor
public class StructureController {

    private final StructureService structureService;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @PostMapping
    public ResponseEntity<StructureDto> create(
            @RequestBody StructureDto structureDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        String moduleCode = resolveModuleCode(structureDto.getStructureType());
        log.info("[StructureController] POST /structures incoming selectedRole={} structureType={} moduleCode={} code={} name={}",
                selectedRole,
                structureDto.getStructureType(),
                moduleCode,
                structureDto.getCode(),
                structureDto.getName());
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                moduleCode,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(structureService.create(structureDto));
    }

    /**
     * Ricerca strutture filtrando per structureType, parentStructureId, code, name, city, active.
     * Viene invocato da GET /api/tenants/structures.
     */
    @GetMapping
        public ResponseEntity<List<StructureDto>> findAll(
            @RequestParam(required = false) String structureType,
                        @RequestParam(required = false) String structureTypes,
            @RequestParam(required = false) Long parentStructureId,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
                    @RequestParam(required = false) String region,
                    @RequestParam(required = false) String parentStructureName,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Boolean active,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
                String moduleCode = resolveSearchModuleCode(structureType, structureTypes);
                        log.info("[StructureController] GET /structures params: structureType={}, structureTypes={}, parentStructureId={}, code={}, name={}, region={}, parentStructureName={}, city={}, active={}, selectedRole={}",
                                        structureType, structureTypes, parentStructureId, code, name, region, parentStructureName, city, active, selectedRole);
        // Loggo i tipi struttura disponibili per debug e prevenzione errori code
        List<StructureTypeDto> types = structureService.findSupportedTypes();
        log.info("[StructureController] Tipi struttura disponibili: {}", types.stream().map(StructureTypeDto::getCode).toList());
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, moduleCode);
                return ResponseEntity.ok(structureService.findAll(structureType, structureTypes, parentStructureId, code, name, region, parentStructureName, city, active));
    }

    @GetMapping("/types")
    public ResponseEntity<List<StructureTypeDto>> findTypes(
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
                controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, StructureModuleCodes.GENERIC);
        return ResponseEntity.ok(structureService.findSupportedTypes());
    }

    @GetMapping("/parent-options")
    public ResponseEntity<List<StructureParentOptionDto>> findParentOptions(
            @RequestParam String structureType,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
                controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, resolveModuleCode(structureType));
        return ResponseEntity.ok(structureService.findParentOptions(structureType));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StructureDto> findById(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(
                selectedRole,
                resolveModuleCode(structureService.findStructureTypeCode(id))
        );
        return ResponseEntity.ok(structureService.findById(id));
    }

        @GetMapping("/{id}/departments")
        public ResponseEntity<List<StructureDepartmentOptionDto>> findDepartmentsByStructureId(
                        @PathVariable Long id,
                        @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
        ) {
                controllerFunctionAuthorizationService.requireModuleAccess(
                                selectedRole,
                                resolveModuleCode(structureService.findStructureTypeCode(id))
                );
                return ResponseEntity.ok(structureService.findDepartmentOptions(id));
        }

    @PutMapping("/{id}")
    public ResponseEntity<StructureDto> update(
            @PathVariable Long id,
            @RequestBody StructureDto structureDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        String moduleCode = resolveModuleCode(structureDto.getStructureType());
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                moduleCode,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(structureService.update(id, structureDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
                String moduleCode = resolveModuleCode(structureService.findStructureTypeCode(id));
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                                moduleCode,
                ControllerFunctionAuthorizationService.DELETE_FUNCTION_CODE
        );
        structureService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/associate")
    public ResponseEntity<StructureDto> associate(
            @RequestBody java.util.Map<String, Object> body,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        String externalSource = (String) body.getOrDefault("externalSource", "QTMTicket");
        Number externalIdNum = (Number) body.get("externalId");
        Long externalId = externalIdNum == null ? null : externalIdNum.longValue();
        String structureType = (String) body.get("structureType");
        String name = (String) body.get("name");
        Number parentExternalIdNum = (Number) body.get("parentExternalId");
        Long parentExternalId = parentExternalIdNum == null ? null : parentExternalIdNum.longValue();
        String referentsJson = (String) body.get("referentsJson");

        if (externalId == null || structureType == null) {
            return ResponseEntity.badRequest().build();
        }

        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                resolveModuleCode(structureType),
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );

        return ResponseEntity.ok(structureService.associateExternal(externalSource, externalId, structureType, name, parentExternalId, referentsJson));
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                resolveModuleCode(structureService.findStructureTypeCode(id)),
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        structureService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

        private String resolveModuleCode(String structureType) {
                return StructureModuleCodes.resolveModuleCode(structureType);
        }

        private String resolveSearchModuleCode(String structureType, String structureTypes) {
                if (structureType != null && !structureType.isBlank()) {
                        return resolveModuleCode(structureType);
                }

                if (structureTypes == null || structureTypes.isBlank()) {
                        return StructureModuleCodes.GENERIC;
                }

                List<String> moduleCodes = java.util.Arrays.stream(structureTypes.split(","))
                        .map(String::trim)
                        .filter(value -> !value.isBlank())
                        .map(this::resolveModuleCode)
                        .distinct()
                        .toList();

                if (moduleCodes.size() == 1) {
                        return moduleCodes.get(0);
                }

                return moduleCodes.stream()
                        .filter(moduleCode -> !Objects.equals(moduleCode, StructureModuleCodes.GENERIC))
                        .findFirst()
                        .orElse(StructureModuleCodes.GENERIC);
        }
}
