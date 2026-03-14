package com.qtm.tenants.project.controller;

import com.qtm.commonlib.dto.ProjectDto;
import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.project.service.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;

/**
 * Controller REST CRUD progetti con inoltro a QTMDashboard.
 */
@RestController
@RequestMapping("/api/tenants/projects")
@RequiredArgsConstructor
@Slf4j
public class ProjectController {

    private static final String MODULE_CODE = "PROJECT";

    private final ProjectService projectService;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @PostMapping
    public ResponseEntity<ProjectDto> create(
            @RequestBody ProjectDto projectDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[ProjectController] POST /api/tenants/projects selectedRole={} code={} tenant={} tenantId={}",
                selectedRole, projectDto.getCode(), projectDto.getTenant(), projectDto.getTenantId());
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.create(projectDto));
    }

        @GetMapping
        public ResponseEntity<List<ProjectDto>> findAll(
                        @RequestParam(required = false) String code,
                        @RequestParam(required = false) String tenant,
                        @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole,
                        @RequestHeader(name = "X-Selected-Client", required = false) String selectedClient,
                        @AuthenticationPrincipal Jwt jwt
        ) {
                String effectiveTenant = tenant;
                if (effectiveTenant == null || effectiveTenant.isBlank()) {
                        if (selectedClient != null && !selectedClient.isBlank()) {
                                effectiveTenant = selectedClient;
                        } else if (jwt != null) {
                                effectiveTenant = jwt.getClaimAsString("client_code");
                                if (effectiveTenant == null || effectiveTenant.isBlank()) {
                                        effectiveTenant = jwt.getClaimAsString("tenant");
                                }
                        }
                }
                log.info("[ProjectController] GET /api/tenants/projects selectedRole={} code={} tenant={} (effettivo)",
                                selectedRole, code, effectiveTenant);
                controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
                return ResponseEntity.ok(projectService.findAll(code, effectiveTenant));
        }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> findById(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[ProjectController] GET /api/tenants/projects/{} selectedRole={}", id, selectedRole);
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(projectService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectDto> update(
            @PathVariable Long id,
            @RequestBody ProjectDto projectDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[ProjectController] PUT /api/tenants/projects/{} selectedRole={} code={} tenant={} tenantId={}",
                id, selectedRole, projectDto.getCode(), projectDto.getTenant(), projectDto.getTenantId());
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(projectService.update(id, projectDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[ProjectController] DELETE /api/tenants/projects/{} selectedRole={}", id, selectedRole);
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.DELETE_FUNCTION_CODE
        );
        projectService.delete(id);
        return ResponseEntity.noContent().build();
    }
}