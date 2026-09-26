package com.qtm.tenants.structure.controller;

import java.util.List;
import java.util.Objects;

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

import com.qtm.external.client.StructureClient;
import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.structure.StructureModuleCodes;
import com.qtm.tenants.structure.dto.StructureDepartmentOptionDto;
import com.qtm.tenants.structure.dto.StructureDto;
import com.qtm.tenants.structure.dto.StructureOverviewDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Controller REST CRUD strutture che delega le operazioni via FeignClient.
 */
@Slf4j
@RestController
@RequestMapping("/api/tenants/structures")
@RequiredArgsConstructor
public class StructureController {

    private final StructureClient structureClient;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @PostMapping
    public ResponseEntity<StructureDto> create(
            @RequestBody StructureDto structureDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        String moduleCode = resolveModuleCode(structureDto.getStructureType());
        log.info("[StructureController] POST /structures via Feign Client selectedRole={} structureType={} code={} name={}",
                selectedRole, structureDto.getStructureType(), structureDto.getCode(), structureDto.getName());
        
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                moduleCode,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        
        return ResponseEntity.ok(structureClient.create(structureDto, selectedRole));
    }

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
        log.info("[StructureController] GET /structures via Feign Client params: structureType={}, active={}, selectedRole={}",
                structureType, active, selectedRole);

        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, moduleCode);

        return ResponseEntity.ok(structureClient.findAll(
                structureType, structureTypes, parentStructureId, code, name, region, parentStructureName, city, active, selectedRole
        ));
    }

    @GetMapping("/overview")
    public ResponseEntity<List<StructureOverviewDto>> findOverview(
            @RequestParam(required = false) String regionCode,
            @RequestParam(required = false) String aslCode,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, StructureModuleCodes.GENERIC);
        log.info("[StructureController] GET /structures/overview via Feign Client regionCode={} aslCode={}", regionCode, aslCode);
        return ResponseEntity.ok(structureClient.findOverview(regionCode, aslCode, selectedRole));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StructureDto> findById(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        // Se la chiamata al Feign client restituisce direttamente la struttura:
        StructureDto dto = structureClient.findById(id, selectedRole);
        if (dto != null) {
            controllerFunctionAuthorizationService.requireModuleAccess(
                    selectedRole,
                    resolveModuleCode(dto.getStructureType())
            );
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}/departments")
    public ResponseEntity<List<StructureDepartmentOptionDto>> findDepartmentsByStructureId(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[StructureController] GET /structures/{}/departments via Feign Client selectedRole={}", id, selectedRole);
        List<StructureDepartmentOptionDto> departments = structureClient.findDepartmentsByStructureId(id, selectedRole);
        return ResponseEntity.ok(departments);
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
        return ResponseEntity.ok(structureClient.update(id, structureDto, selectedRole));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        structureClient.delete(id, selectedRole);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/associate")
    public ResponseEntity<StructureDto> associate(
            @RequestBody java.util.Map<String, Object> body,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        String structureType = (String) body.get("structureType");
        Number externalIdNum = (Number) body.get("externalId");

        if (externalIdNum == null || structureType == null) {
            return ResponseEntity.badRequest().build();
        }

        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                resolveModuleCode(structureType),
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );

        return ResponseEntity.ok(structureClient.associate(body, selectedRole));
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        structureClient.deactivate(id, selectedRole);
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