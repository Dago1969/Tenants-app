package com.qtm.tenants.tenant.controller;

import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.tenant.dto.TenantAppPointerDto;
import com.qtm.tenants.tenant.service.TenantAppPointerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint TENANTS-APP che inoltra a QTMDashboard la lookup del tenant pointer usato dal frontend.
 */
@RestController
@RequestMapping("/api/tenants/tenant-app-pointers")
@RequiredArgsConstructor
@Slf4j
public class TenantAppPointerController {

    private static final String MODULE_CODE = "PROJECT";

    private final TenantAppPointerService tenantAppPointerService;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @GetMapping("/by-client/{clientCode}")
    public ResponseEntity<TenantAppPointerDto> getByClientCode(
            @PathVariable String clientCode,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        log.info("[TenantAppPointerController] GET /api/tenants/tenant-app-pointers/by-client/{} selectedRole={}",
                clientCode, selectedRole);
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(tenantAppPointerService.findByClientCode(clientCode));
    }
}