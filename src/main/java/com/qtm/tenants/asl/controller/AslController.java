package com.qtm.tenants.asl.controller;

import java.util.List;

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

import com.qtm.commonlib.dto.ASLDto;
import com.qtm.commonlib.dto.ASLImportRequest;
import com.qtm.commonlib.dto.ASLOverviewDto;
import com.qtm.external.client.AslDashboardClient;
import com.qtm.external.client.HealthStructureClient;
import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.structure.StructureModuleCodes;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Controller REST ASL che delega catalogo e persistenza a Health Structure.
 */
@Slf4j
@RestController
@RequestMapping("/api/tenants/asl")
@RequiredArgsConstructor
public class AslController {

        private final HealthStructureClient healthStructureClient;
        private final AslDashboardClient aslDashboardClient;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @GetMapping
    public ResponseEntity<List<ASLDto>> findAll(
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[AslController] GET /api/tenants/asl selectedRole={}", selectedRole);
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, StructureModuleCodes.GENERIC);
        return ResponseEntity.ok(healthStructureClient.findAsl());
    }

    @GetMapping("/overview")
    public ResponseEntity<List<ASLOverviewDto>> findOverview(
    		@RequestParam(required = false) String regionCode,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[AslController] GET /api/tenants/asl/overview selectedRole={}", selectedRole);
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, StructureModuleCodes.GENERIC);
        List<ASLOverviewDto> associatedAsls = aslDashboardClient.findAllWithImportStatus(regionCode).stream()
                .filter(asl -> Boolean.TRUE.equals(asl.getImported()))
                .toList();
        return ResponseEntity.ok(associatedAsls);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ASLDto> findById(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[AslController] GET /api/tenants/asl/{} selectedRole={}", id, selectedRole);
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, StructureModuleCodes.GENERIC);
        
        ASLDto dto = healthStructureClient.findAslById(id);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PostMapping("/import")
    public ResponseEntity<List<ASLDto>> importFromSource(
            @RequestBody ASLImportRequest request,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[AslController] POST /api/tenants/asl/import selectedRole={}", selectedRole);
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                StructureModuleCodes.GENERIC,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(aslDashboardClient.importFromSource(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ASLDto> update(
            @PathVariable Long id,
            @RequestBody ASLDto dto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[AslController] PUT /api/tenants/asl/{} selectedRole={}", id, selectedRole);
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                StructureModuleCodes.GENERIC,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(healthStructureClient.updateAsl(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[AslController] DELETE /api/tenants/asl/{} selectedRole={}", id, selectedRole);
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                StructureModuleCodes.GENERIC,
                ControllerFunctionAuthorizationService.DELETE_FUNCTION_CODE
        );
        healthStructureClient.deleteAsl(id);
        return ResponseEntity.noContent().build();
    }
}