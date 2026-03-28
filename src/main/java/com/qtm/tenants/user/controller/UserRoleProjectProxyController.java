package com.qtm.tenants.user.controller;

import com.qtm.commonlib.dto.UserRoleProjectDto;
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
@RequestMapping("/api/user-role-project")
@RequiredArgsConstructor
@Slf4j
public class UserRoleProjectProxyController {

    private final DashboardUserRoleProjectClient dashboardUserRoleProjectClient;

    @GetMapping("/user/{userId}/tenant/{tenantId}")
    public ResponseEntity<List<UserRoleProjectDto>> getByUserAndTenant(@PathVariable Long userId,
                                                                       @PathVariable Long tenantId) {
        log.info("[TENAPP] Proxy GET /api/user-role-project/user/{}/tenant/{}", userId, tenantId);
        return ResponseEntity.ok(dashboardUserRoleProjectClient.findByUserAndTenant(userId, tenantId));
    }

    @PostMapping
    public ResponseEntity<UserRoleProjectDto> create(@RequestBody UserRoleProjectDto dto) {
        log.info("[TENAPP] Proxy POST /api/user-role-project userId={} tenantId={} roleId={} projectId={}",
                dto.getUserId(), dto.getTenantId(), dto.getRoleId(), dto.getProjectId());
        return ResponseEntity.ok(dashboardUserRoleProjectClient.create(dto));
    }

    @DeleteMapping("/user/{userId}/tenant/{tenantId}/role/{roleId}/project/{projectId}")
    public ResponseEntity<Void> delete(@PathVariable Long userId,
                                       @PathVariable Long tenantId,
                                       @PathVariable String roleId,
                                       @PathVariable Long projectId) {
        log.info("[TENAPP] Proxy DELETE /api/user-role-project/user/{}/tenant/{}/role/{}/project/{}", userId, tenantId, roleId, projectId);
        dashboardUserRoleProjectClient.delete(userId, tenantId, roleId, projectId);
        return ResponseEntity.noContent().build();
    }
}