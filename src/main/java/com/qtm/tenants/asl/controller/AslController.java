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
import com.qtm.external.client.AslClient;
import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.structure.StructureModuleCodes;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Controller REST CRUD ASL che delega le operazioni via FeignClient (AslClient).
 */
@Slf4j
@RestController
@RequestMapping("/api/tenants/asl")
@RequiredArgsConstructor
public class AslController {

    private final AslClient aslClient;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @GetMapping
    public ResponseEntity<List<ASLDto>> findAll(
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[AslController] GET /api/tenants/asl via Feign Client selectedRole={}", selectedRole);
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, StructureModuleCodes.GENERIC);
        return ResponseEntity.ok(aslClient.findAll());
    }

    @GetMapping("/overview")
    public ResponseEntity<List<ASLOverviewDto>> findOverview(
    		@RequestParam(required = false) String regionCode,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[AslController] GET /api/tenants/asl/overview via Feign Client selectedRole={}", selectedRole);
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, StructureModuleCodes.GENERIC);
        return ResponseEntity.ok(aslClient.findAllWithImportStatus(regionCode));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ASLDto> findById(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[AslController] GET /api/tenants/asl/{} via Feign Client selectedRole={}", id, selectedRole);
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, StructureModuleCodes.GENERIC);
        
        ASLDto dto = aslClient.findById(id);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PostMapping("/import")
    public ResponseEntity<List<ASLDto>> importFromSource(
            @RequestBody ASLImportRequest request,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[AslController] POST /api/tenants/asl/import via Feign Client selectedRole={}", selectedRole);
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                StructureModuleCodes.GENERIC,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(aslClient.importFromSource(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ASLDto> update(
            @PathVariable Long id,
            @RequestBody ASLDto dto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[AslController] PUT /api/tenants/asl/{} via Feign Client selectedRole={}", id, selectedRole);
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                StructureModuleCodes.GENERIC,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(aslClient.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[AslController] DELETE /api/tenants/asl/{} via Feign Client selectedRole={}", id, selectedRole);
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                StructureModuleCodes.GENERIC,
                ControllerFunctionAuthorizationService.DELETE_FUNCTION_CODE
        );
        aslClient.deleteAssociation(id);
        return ResponseEntity.noContent().build();
    }
}