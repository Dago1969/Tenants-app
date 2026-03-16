package com.qtm.tenants.user.controller;

import com.qtm.commonlib.dto.UserTenantRoleRelationDto;
import com.qtm.tenants.role.service.DashboardRoleClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Proxy REST per inoltrare le richieste user-tenant-role a QTMDashboard.
 */
@RestController
@RequestMapping("/api/user-tenant-role")
@RequiredArgsConstructor
@Slf4j
public class UserTenantRoleRelationProxyController {

    private final DashboardRoleClient dashboardRoleClient;

    @PostMapping
    public ResponseEntity<UserTenantRoleRelationDto> proxyAddRelation(@RequestBody UserTenantRoleRelationDto dto) {
        log.info("[TENAPP] Proxy POST /api/user-tenant-role userId={} tenantId={} roleId={}", dto.getUserId(), dto.getTenantId(), dto.getRoleId());
        return ResponseEntity.ok(dashboardRoleClient.proxyAddUserTenantRoleRelation(dto));
    }

    @GetMapping("/user/{userId}/tenant/{tenantId}")
    public ResponseEntity<List<UserTenantRoleRelationDto>> proxyGetByUserAndTenant(
            @PathVariable Long userId,
            @PathVariable Long tenantId
    ) {
        log.info("[TENAPP] Proxy GET /api/user-tenant-role/user/{}/tenant/{}", userId, tenantId);
        return ResponseEntity.ok(dashboardRoleClient.proxyGetUserTenantRoleRelationByUserAndTenant(userId, tenantId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> proxyDeleteRelation(@PathVariable Long id) {
        log.info("[TENAPP] Proxy DELETE /api/user-tenant-role/{}", id);
        dashboardRoleClient.proxyDeleteUserTenantRoleRelation(id);
        return ResponseEntity.noContent().build();
    }
}