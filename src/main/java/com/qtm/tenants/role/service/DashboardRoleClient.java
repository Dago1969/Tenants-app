package com.qtm.tenants.role.service;

import com.qtm.commonlib.dto.RoleDeleteCheckDto;
import com.qtm.commonlib.dto.RoleDto;
import com.qtm.commonlib.dto.UserTenantRoleRelationDto;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;

/**
 * Client REST verso QTMDashboard per la persistenza centralizzata dei ruoli.
 */
@Service
@Slf4j
public class DashboardRoleClient {

    private static final ParameterizedTypeReference<List<RoleDto>> ROLE_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final ParameterizedTypeReference<List<UserTenantRoleRelationDto>> USER_TENANT_ROLE_RELATION_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final String SERVICE_UNAVAILABLE_MESSAGE = "Servizio ruoli QTMDashboard non disponibile";

    private final RestClient restClient;

    public DashboardRoleClient(
            RestClient.Builder restClientBuilder,
            @Value("${qtm.dashboard.api-base-url}") String dashboardApiBaseUrl
    ) {
        this.restClient = restClientBuilder
                .baseUrl(dashboardApiBaseUrl)
                .build();
        log.info("[DashboardRoleClient] Configured with dashboardApiBaseUrl={}", dashboardApiBaseUrl);
    }

    public RoleDto create(RoleDto roleDto) {
        return execute(() -> restClient.post().uri("/roles")
                .headers(this::applyForwardedHeaders)
                .body(roleDto)
                .retrieve()
                .body(RoleDto.class));
    }

    public List<RoleDto> findAll() {
        return execute(() -> restClient.get().uri("/roles")
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(ROLE_LIST_TYPE));
    }

    public RoleDto findById(String id) {
        return execute(() -> restClient.get().uri("/roles/{id}", id)
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(RoleDto.class));
    }

    public RoleDeleteCheckDto getDeleteCheck(String id) {
        return execute(() -> restClient.get().uri("/roles/delete-check/{id}", id)
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(RoleDeleteCheckDto.class));
    }

    public RoleDto update(String id, RoleDto roleDto) {
        return execute(() -> restClient.put().uri("/roles/{id}", id)
                .headers(this::applyForwardedHeaders)
                .body(roleDto)
                .retrieve()
                .body(RoleDto.class));
    }

    public void delete(String id, String replacementRoleId) {
        executeVoid(() -> restClient.delete()
                .uri(uriBuilder -> uriBuilder.path("/roles/{id}")
                        .queryParamIfPresent("replacementRoleId", Optional.ofNullable(replacementRoleId).filter(value -> !value.isBlank()))
                        .build(id))
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .toBodilessEntity());
    }

    public List<UserTenantRoleRelationDto> proxyGetUserTenantRoleRelationByUserAndTenant(Long userId, Long tenantId) {
        return execute(() -> restClient.get()
            .uri("/user-tenant-role/user/{userId}/tenant/{tenantId}", userId, tenantId)
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(USER_TENANT_ROLE_RELATION_LIST_TYPE));
    }

    public UserTenantRoleRelationDto proxyAddUserTenantRoleRelation(UserTenantRoleRelationDto dto) {
        return execute(() -> restClient.post().uri("/user-tenant-role")
                .headers(this::applyForwardedHeaders)
                .body(dto)
                .retrieve()
                .body(UserTenantRoleRelationDto.class));
    }

    public void proxyDeleteUserTenantRoleRelation(Long id) {
        executeVoid(() -> restClient.delete()
            .uri("/user-tenant-role/{id}", id)
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .toBodilessEntity());
    }

    public void proxyDeleteUserTenantRoleRelation(Long userId, Long tenantId, String roleId) {
        executeVoid(() -> restClient.delete()
                .uri("/user-tenant-role/user/{userId}/tenant/{tenantId}/role/{roleId}", userId, tenantId, roleId)
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .toBodilessEntity());
    }

    private void applyForwardedHeaders(HttpHeaders headers) {
        HttpServletRequest currentRequest = resolveCurrentRequest();
        if (currentRequest == null) {
            return;
        }

        copyHeader(currentRequest, headers, HttpHeaders.AUTHORIZATION);
        copyHeader(currentRequest, headers, "X-Selected-Role");
        copyHeader(currentRequest, headers, "X-Selected-Client");
    }

    private void copyHeader(HttpServletRequest request, HttpHeaders headers, String headerName) {
        String value = request.getHeader(headerName);
        if (value != null && !value.isBlank()) {
            headers.set(headerName, value);
        }
    }

    private HttpServletRequest resolveCurrentRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes == null ? null : attributes.getRequest();
    }

    private <T> T execute(RestCall<T> call) {
        try {
            return call.execute();
        } catch (RestClientResponseException exception) {
            log.error("[DashboardRoleClient] Downstream response error status={} body={}",
                    exception.getStatusCode(), exception.getResponseBodyAsString(), exception);
            throw new ResponseStatusException(exception.getStatusCode(), buildDownstreamMessage(exception), exception);
        } catch (RestClientException exception) {
            log.error("[DashboardRoleClient] Downstream connectivity error", exception);
            throw new ResponseStatusException(BAD_GATEWAY, SERVICE_UNAVAILABLE_MESSAGE, exception);
        }
    }

    private void executeVoid(RestVoidCall call) {
        try {
            call.execute();
        } catch (RestClientResponseException exception) {
            log.error("[DashboardRoleClient] Downstream void response error status={} body={}",
                    exception.getStatusCode(), exception.getResponseBodyAsString(), exception);
            throw new ResponseStatusException(exception.getStatusCode(), buildDownstreamMessage(exception), exception);
        } catch (RestClientException exception) {
            log.error("[DashboardRoleClient] Downstream void connectivity error", exception);
            throw new ResponseStatusException(BAD_GATEWAY, SERVICE_UNAVAILABLE_MESSAGE, exception);
        }
    }

    private String buildDownstreamMessage(RestClientResponseException exception) {
        String responseBody = exception.getResponseBodyAsString();
        if (responseBody == null || responseBody.isBlank()) {
            return "Errore restituito da QTMDashboard durante la gestione ruoli";
        }
        return responseBody;
    }

    @FunctionalInterface
    private interface RestCall<T> {
        T execute();
    }

    @FunctionalInterface
    private interface RestVoidCall {
        void execute();
    }
}