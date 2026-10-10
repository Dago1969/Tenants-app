package com.qtm.tenants.structure.controller;

import java.util.List;
import java.util.Objects;

import com.qtm.commonlib.dto.StructureDepartmentOverviewDto;
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
import com.qtm.tenants.structure.service.StructureService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Controller REST per il catalogo Health Structure e le mutazioni gestite da Dashboard.
 */
@Slf4j
@RestController
@RequestMapping({"/api/tenants/hospitals", "/api/tenants/structures"})
@RequiredArgsConstructor
public class StructureController {

    private final StructureClient structureClient;
    private final StructureService structureService;
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
        log.info("[StructureController] GET /structures params: structureType={}, active={}, selectedRole={}",
                structureType, active, selectedRole);

        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, moduleCode);

        List<StructureDto> structures = structureService.findAll(
            structureType, structureTypes, parentStructureId, code, name, region, parentStructureName, city, active
        );

        if ("SPECIALIST_CLINIC".equalsIgnoreCase(structureType) && Boolean.TRUE.equals(active)) {
            structures = structures.stream()
                    .filter(structure -> "SPECIALIST_CLINIC".equalsIgnoreCase(structure.getStructureType()))
                    .filter(StructureDto::isActive)
                    .toList();
        }

        return ResponseEntity.ok(structures);
    }

    @GetMapping("/overview")
    public ResponseEntity<List<StructureOverviewDto>> findOverview(
            @RequestParam(required = false) String regionCode,
            @RequestParam(required = false) String aslCode,
            @RequestParam(required = false) Long hospitalId,
            @RequestParam(name = "structureId", required = false) Long legacyStructureId,
            @RequestParam(name = "strutturaId", required = false) Long legacyItalianStructureId,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, StructureModuleCodes.GENERIC);
        Long resolvedHospitalId = hospitalId != null ? hospitalId
            : legacyStructureId != null ? legacyStructureId : legacyItalianStructureId;
        log.info("[StructureController] GET /hospitals/overview regionCode={} aslCode={} hospitalId={}",
            regionCode, aslCode, resolvedHospitalId);
        List<StructureOverviewDto> structures = structureService.findOverview(regionCode, aslCode);
        if (resolvedHospitalId != null) {
            structures = structures.stream()
                .filter(hospital -> resolvedHospitalId.equals(hospital.getStrutturaId()))
                .toList();
        }
        log.info("[StructureController] GET /structures/overview returned {} hospitals regionCode={} aslCode={}",
            structures == null ? 0 : structures.size(), regionCode, aslCode);
        return ResponseEntity.ok(structures);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StructureDto> findById(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        StructureDto dto = structureService.findById(id);
        controllerFunctionAuthorizationService.requireModuleAccess(
            selectedRole,
            resolveModuleCode(dto.getStructureType())
        );
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/departments/overview")
    public ResponseEntity<List<StructureDepartmentOverviewDto>> findDepartmentOverview(
            @RequestParam(required = false) String regionCode,
            @RequestParam(required = false) String aslCode,
            @RequestParam(required = false) String hospitalCode,
            @RequestParam(name = "structureCode", required = false) String legacyStructureCode,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        String resolvedHospitalCode = hospitalCode != null ? hospitalCode : legacyStructureCode;
        log.info("[StructureController] GET /structures/departments/overview regionCode={} aslCode={} structureCode={}",
            regionCode, aslCode, resolvedHospitalCode);
        return ResponseEntity.ok(structureClient.findDepartmentOverview(regionCode, aslCode, resolvedHospitalCode, selectedRole));
    }

    @GetMapping("/{id}/departments")
    public ResponseEntity<List<StructureDepartmentOptionDto>> findDepartmentsByStructureId(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[StructureController] GET /structures/{}/departments via Feign Client selectedRole={}", id, selectedRole);
        List<StructureDepartmentOptionDto> departments = structureService.findDepartmentOptions(id);
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