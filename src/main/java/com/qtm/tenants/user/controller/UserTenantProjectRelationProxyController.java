package com.qtm.tenants.user.controller;

import com.qtm.commonlib.dto.UserTenantProjectRelationDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.qtm.tenants.project.service.DashboardProjectClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Proxy REST per inoltrare la POST /api/user-tenant-project a QTMDashboard.
 * Non toccare mai il baseUrl del frontend!
 */
@RestController
@RequestMapping("/api/user-tenant-project")
@RequiredArgsConstructor
public class UserTenantProjectRelationProxyController {
    private static final Logger log = LoggerFactory.getLogger(UserTenantProjectRelationProxyController.class);
    private final DashboardProjectClient dashboardProjectClient;

    @PostMapping
    public ResponseEntity<UserTenantProjectRelationDto> proxyAddRelation(@RequestBody UserTenantProjectRelationDto dto) {
        // Log dettagliato dei valori ricevuti
        log.info("[TENAPP] Ricevuto DTO: {}", dto);
        if (dto != null) {
            log.info("[TENAPP] userId={}, tenantId={}, projectId={}, superuser={}, email={}", dto.getUserId(), dto.getTenantId(), dto.getProjectId(), dto.isSuperuser(), dto.getEmail());
        }
        // Inoltra la richiesta a QTMDashboard tramite il client REST
        UserTenantProjectRelationDto result = dashboardProjectClient.proxyAddUserTenantProjectRelation(dto);
        return ResponseEntity.ok(result);
    }

    /**
     * Proxy GET per inoltrare la richiesta di relazioni user-tenant-progetto a QTMDashboard.
     */
    @org.springframework.web.bind.annotation.GetMapping("/user/{userId}/tenant/{tenantId}")
    public ResponseEntity<java.util.List<UserTenantProjectRelationDto>> proxyGetByUserAndTenant(
            @org.springframework.web.bind.annotation.PathVariable Long userId,
            @org.springframework.web.bind.annotation.PathVariable Long tenantId) {
        log.info("[TENAPP] Proxy GET /api/user-tenant-project/user/{}/tenant/{}", userId, tenantId);
        java.util.List<UserTenantProjectRelationDto> result = dashboardProjectClient.proxyGetUserTenantProjectRelationByUserAndTenant(userId, tenantId);
        return ResponseEntity.ok(result);
    }
}
