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
    private final com.qtm.tenants.keycloak.KeycloakAdminService keycloakAdminService;

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
        UserRoleProjectDto created = dashboardUserRoleProjectClient.create(dto);
        // try to assign the role on Keycloak using forwarded header X-Selected-Client (client code)
        try {
            jakarta.servlet.http.HttpServletRequest current = ((jakarta.servlet.http.HttpServletRequest) null);
        } catch (Exception ignored) {
        }
        // read X-Selected-Client from current request attributes
        String selectedClient = null;
        try {
            jakarta.servlet.http.HttpServletRequest request = ((org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes()).getRequest();
            selectedClient = request.getHeader("X-Selected-Client");
        } catch (Exception ex) {
            log.debug("[UserRoleProjectProxyController] No X-Selected-Client header available");
        }
        if (selectedClient != null && !selectedClient.isBlank()) {
            keycloakAdminService.assignRoleForAssociation(created.getUserId(), selectedClient.trim(), created.getRoleId());
        }
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/user/{userId}/tenant/{tenantId}/role/{roleId}/project/{projectId}")
    public ResponseEntity<Void> delete(@PathVariable Long userId,
                                       @PathVariable Long tenantId,
                                       @PathVariable String roleId,
                                       @PathVariable Long projectId) {
        log.info("[TENAPP] Proxy DELETE /api/user-role-project/user/{}/tenant/{}/role/{}/project/{}", userId, tenantId, roleId, projectId);
        dashboardUserRoleProjectClient.delete(userId, tenantId, roleId, projectId);
        // try to remove role from Keycloak using forwarded header X-Selected-Client
        String selectedClient = null;
        try {
            jakarta.servlet.http.HttpServletRequest request = ((org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes()).getRequest();
            selectedClient = request.getHeader("X-Selected-Client");
        } catch (Exception ex) {
            log.debug("[UserRoleProjectProxyController] No X-Selected-Client header available");
        }
        if (selectedClient != null && !selectedClient.isBlank()) {
            keycloakAdminService.removeRoleForDisassociation(userId, selectedClient.trim(), roleId);
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> deleteByUserId(@PathVariable Long userId) {
        log.info("[TENAPP] Proxy DELETE /api/user-role-project/user/{} (bulk delete)", userId);
        dashboardUserRoleProjectClient.deleteByUserId(userId);
        return ResponseEntity.noContent().build();
    }
}