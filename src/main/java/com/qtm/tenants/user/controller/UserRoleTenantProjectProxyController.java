package com.qtm.tenants.user.controller;

import com.qtm.commonlib.dto.UserRoleTenantProjectDto;
import com.qtm.tenants.user.service.DashboardUserRoleProjectClient;
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
 * Proxy REST TENAPP per l'API centralizzata user-role-project di QTMDB.
 */
@RestController
@RequestMapping("/api/user-role-tenant-project")
@RequiredArgsConstructor
@Slf4j
public class UserRoleTenantProjectProxyController {

    private final DashboardUserRoleProjectClient dashboardUserRoleProjectClient;

    @GetMapping("/user/{userId}/tenant/{tenantId}/role/{roleId}")
    public ResponseEntity<List<UserRoleTenantProjectDto>> getByUserTenantAndRole(@PathVariable Long userId,
                                                                           @PathVariable Long tenantId,
                                                                           @PathVariable String roleId) {
        log.info("[TENAPP] Proxy GET /api/user-role-tenant-project/user/{}/tenant/{}/role/{}", userId, tenantId, roleId);
        return ResponseEntity.ok(dashboardUserRoleProjectClient.findByUserTenantAndRole(userId, tenantId, roleId));
    }

    @PostMapping
    public ResponseEntity<UserRoleTenantProjectDto> create(@RequestBody UserRoleTenantProjectDto dto) {
        log.info("[TENAPP] Proxy POST /api/user-role-tenant-project userId={} tenantId={} roleId={} projectId={}",
                dto.getUserId(), dto.getTenantId(), dto.getRoleId(), dto.getProjectId());
        return ResponseEntity.ok(dashboardUserRoleProjectClient.create(dto));
    }

    @DeleteMapping("/user/{userId}/tenant/{tenantId}/role/{roleId}/project/{projectId}")
    public ResponseEntity<Void> delete(@PathVariable Long userId,
                                       @PathVariable Long tenantId,
                                       @PathVariable String roleId,
                                       @PathVariable String projectId) {
        log.info("[TENAPP] Proxy DELETE /api/user-role-tenant-project/user/{}/tenant/{}/role/{}/project/{}", userId, tenantId, roleId, projectId);
        dashboardUserRoleProjectClient.delete(userId, tenantId, roleId, projectId);
        return ResponseEntity.noContent().build();
    }
}