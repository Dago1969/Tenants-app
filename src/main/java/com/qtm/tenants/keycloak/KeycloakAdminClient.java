package com.qtm.tenants.keycloak;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;

/**
 * Client REST minimo verso Keycloak Admin (token + alcune chiamate admin)
 */
@Service
@Slf4j
public class KeycloakAdminClient {

    private final RestClient restClient;
    private final String realm;
    private final String adminClientId;
    private final String adminClientSecret;

    public KeycloakAdminClient(RestClient.Builder restClientBuilder,
                               @Value("${	:${APP_KEYCLOAK_SERVER_URL:https://auth.qtmdev.quicare.com}}") String baseUrl,
                               @Value("${app.keycloak.realm:${APP_KEYCLOAK_REALM_CODE:Lecigimon}}") String realm,
                               @Value("${app.keycloak.admin-client-id:${APP_KEYCLOAK_ADMIN_CLIENT_ID:tenants-app-admin}}") String adminClientId,
                               @Value("${app.keycloak.admin-client-secret:${APP_KEYCLOAK_ADMIN_CLIENT_SECRET:}}") String adminClientSecret) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.realm = realm;
        this.adminClientId = adminClientId;
        this.adminClientSecret = adminClientSecret;
        log.info("[KeycloakAdminClient] configured baseUrl={} realm={} adminClientId={}", baseUrl, realm, adminClientId);
    }

    public String obtainAdminAccessToken() {
        try {
            Map<String, Object> response = restClient.post()
                    .uri(uriBuilder -> uriBuilder.path("/realms/{realm}/protocol/openid-connect/token").build(realm))
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                    .body("grant_type=client_credentials&client_id=" + adminClientId + (adminClientSecret != null && !adminClientSecret.isBlank() ? "&client_secret=" + adminClientSecret : ""))
                    .retrieve()
                    .body(Map.class);
            return (String) response.get("access_token");
        } catch (RestClientResponseException ex) {
            log.error("[KeycloakAdminClient] token response error status={} body={}", ex.getStatusCode(), ex.getResponseBodyAsString(), ex);
            throw ex;
        } catch (RestClientException ex) {
            log.error("[KeycloakAdminClient] token request failed", ex);
            throw ex;
        }
    }

    public Map<String, Object>[] findClientByClientId(String adminToken, String clientId) {
        try {
            return restClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/admin/realms/{realm}/clients").queryParam("clientId", clientId).build(realm))
                    .headers(h -> h.setBearerAuth(adminToken))
                    .retrieve()
                    .body(Map[].class);
        } catch (RestClientResponseException ex) {
            log.error("[KeycloakAdminClient] findClient error status={} body={}", ex.getStatusCode(), ex.getResponseBodyAsString(), ex);
            throw ex;
        }
    }

    public Map<String, Object> getClientRole(String adminToken, String clientUuid, String roleName) {
        try {
            return restClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/admin/realms/{realm}/clients/{clientUuid}/roles/{role}").build(realm, clientUuid, roleName))
                    .headers(h -> h.setBearerAuth(adminToken))
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException ex) {
            log.error("[KeycloakAdminClient] getClientRole error status={} body={}", ex.getStatusCode(), ex.getResponseBodyAsString(), ex);
            throw ex;
        }
    }

    public void assignClientRoleToUser(String adminToken, String userId, String clientUuid, Object roleRepresentation) {
        try {
                    restClient.post()
                        .uri(uriBuilder -> uriBuilder.path("/admin/realms/{realm}/users/{userId}/role-mappings/clients/{clientUuid}").build(realm, userId, clientUuid))
                        .headers(h -> h.setBearerAuth(adminToken))
                        .body(new Object[]{roleRepresentation})
                        .retrieve()
                        .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            log.error("[KeycloakAdminClient] assignClientRoleToUser error status={} body={}", ex.getStatusCode(), ex.getResponseBodyAsString(), ex);
            throw ex;
        }
    }

    public void removeClientRoleFromUser(String adminToken, String userId, String clientUuid, Object roleRepresentation) {
        try {
                // Some HTTP clients/frameworks do not allow a body on DELETE; use POST with method override
                restClient.post()
                        .uri(uriBuilder -> uriBuilder.path("/admin/realms/{realm}/users/{userId}/role-mappings/clients/{clientUuid}").build(realm, userId, clientUuid))
                        .headers(h -> {
                            h.setBearerAuth(adminToken);
                            h.set("X-HTTP-Method-Override", "DELETE");
                        })
                        .body(new Object[]{roleRepresentation})
                        .retrieve()
                        .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            log.error("[KeycloakAdminClient] removeClientRoleFromUser error status={} body={}", ex.getStatusCode(), ex.getResponseBodyAsString(), ex);
            throw ex;
        }
    }

    public Map<String, Object>[] findUsersByUsername(String adminToken, String username) {
        try {
            return restClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/admin/realms/{realm}/users").queryParam("username", username).build(realm))
                    .headers(h -> h.setBearerAuth(adminToken))
                    .retrieve()
                    .body(Map[].class);
        } catch (RestClientResponseException ex) {
            log.error("[KeycloakAdminClient] findUsersByUsername error status={} body={}", ex.getStatusCode(), ex.getResponseBodyAsString(), ex);
            throw ex;
        }
    }
}
