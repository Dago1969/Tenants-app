package com.qtm.tenants.keycloak;

import com.qtm.tenants.user.service.UserRemoteService;
import com.qtm.tenants.tenant.service.DashboardTenantPointerClient;
import com.qtm.tenants.tenant.dto.TenantAppPointerDto;
import com.qtm.commonlib.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakAdminService {

    private final KeycloakAdminClient client;
    private final UserRemoteService userRemoteService;
    private final DashboardTenantPointerClient tenantPointerClient;

    public void assignRoleForAssociation(Long userId, String clientCode, String roleName) {
        try {
            UserDto user = userRemoteService.findById(userId);
            if (user == null) {
                log.warn("[KeycloakAdminService] No user found id={}", userId);
                return;
            }

            if (clientCode == null) {
                log.warn("[KeycloakAdminService] No clientCode provided for tenantId association userId={}", userId);
                return;
            }

            String adminToken = client.obtainAdminAccessToken();

            Map<String, Object>[] clients = client.findClientByClientId(adminToken, clientCode);
            if (clients == null || clients.length == 0) {
                log.warn("[KeycloakAdminService] No Keycloak client found for clientCode={}", clientCode);
                return;
            }
            String clientUuid = (String) clients[0].get("id");

            Map<String, Object> role = client.getClientRole(adminToken, clientUuid, roleName);

            // find keycloak user id by username
            Map<String, Object>[] users = client.findUsersByUsername(adminToken, user.getUsername());
            if (users == null || users.length == 0) {
                log.warn("[KeycloakAdminService] No Keycloak user found for username={}", user.getUsername());
                return;
            }
            String keycloakUserId = (String) users[0].get("id");

            client.assignClientRoleToUser(adminToken, keycloakUserId, clientUuid, role);
            log.info("[KeycloakAdminService] assigned role {} for user {} on client {}", roleName, user.getUsername(), clientCode);
        } catch (Exception ex) {
            log.error("[KeycloakAdminService] error assigning role {} to userId={} clientCode={}", roleName, userId, clientCode, ex);
        }
    }

    public void removeRoleForDisassociation(Long userId, String clientCode, String roleName) {
        try {
            UserDto user = userRemoteService.findById(userId);
            if (user == null) {
                log.warn("[KeycloakAdminService] No user found id={}", userId);
                return;
            }

            if (clientCode == null) {
                log.warn("[KeycloakAdminService] No clientCode provided for tenantId disassociation userId={}", userId);
                return;
            }

            String adminToken = client.obtainAdminAccessToken();

            Map<String, Object>[] clients = client.findClientByClientId(adminToken, clientCode);
            if (clients == null || clients.length == 0) {
                log.warn("[KeycloakAdminService] No Keycloak client found for clientCode={}", clientCode);
                return;
            }
            String clientUuid = (String) clients[0].get("id");

            Map<String, Object> role = client.getClientRole(adminToken, clientUuid, roleName);

            Map<String, Object>[] users = client.findUsersByUsername(adminToken, user.getUsername());
            if (users == null || users.length == 0) {
                log.warn("[KeycloakAdminService] No Keycloak user found for username={}", user.getUsername());
                return;
            }
            String keycloakUserId = (String) users[0].get("id");

            client.removeClientRoleFromUser(adminToken, keycloakUserId, clientUuid, role);
            log.info("[KeycloakAdminService] removed role {} for user {} on client {}", roleName, user.getUsername(), clientCode);
        } catch (Exception ex) {
            log.error("[KeycloakAdminService] error removing role {} from userId={} clientCode={}", roleName, userId, clientCode, ex);
        }
    }
}
