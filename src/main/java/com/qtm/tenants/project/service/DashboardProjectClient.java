
package com.qtm.tenants.project.service;

import com.qtm.commonlib.dto.UserTenantProjectRelationDto;

import com.qtm.commonlib.dto.ProjectDto;
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

import static org.springframework.http.HttpStatus.BAD_GATEWAY;

/**
 * Client REST verso QTMDashboard per la persistenza centralizzata dei progetti.
 */
@Service
@Slf4j
public class DashboardProjectClient {
        /**
         * Proxy GET per inoltrare la richiesta di relazioni user-tenant-progetto a QTMDashboard.
         */
        public java.util.List<UserTenantProjectRelationDto> proxyGetUserTenantProjectRelationByUserAndTenant(Long userId, Long tenantId) {
            log.info("[DashboardProjectClient] Proxy GET user-tenant-project by userId={} tenantId={}", userId, tenantId);
            return execute(() -> restClient.get()
                .uri("/user-tenant-project/user/{userId}/tenant/{tenantId}", userId, tenantId)
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(new org.springframework.core.ParameterizedTypeReference<java.util.List<UserTenantProjectRelationDto>>() {}));
        }
    /**
     * Inoltra la POST di UserTenantProjectRelationDto a QTMDashboard.
     */
    public UserTenantProjectRelationDto proxyAddUserTenantProjectRelation(UserTenantProjectRelationDto dto) {
        log.info("[DashboardProjectClient] Proxy POST user-tenant-project: {}", dto);
        return execute(() -> restClient.post().uri("/user-tenant-project")
            .headers(this::applyForwardedHeaders)
            .body(dto)
            .retrieve()
            .body(UserTenantProjectRelationDto.class));
    }

    private static final ParameterizedTypeReference<List<ProjectDto>> PROJECT_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final String SERVICE_UNAVAILABLE_MESSAGE = "Servizio progetti QTMDashboard non disponibile";

    private final RestClient restClient;

    public DashboardProjectClient(
            RestClient.Builder restClientBuilder,
            @Value("${qtm.dashboard.api-base-url}") String dashboardApiBaseUrl
    ) {
        this.restClient = restClientBuilder
                .baseUrl(dashboardApiBaseUrl)
                .build();
        log.info("[DashboardProjectClient] Configured with dashboardApiBaseUrl={}", dashboardApiBaseUrl);
    }

    public ProjectDto create(ProjectDto projectDto) {
        log.info("[DashboardProjectClient] Forwarding create project request: code={}, tenant={}, tenantId={}",
                projectDto.getCode(), projectDto.getTenant(), projectDto.getTenantId());
        return execute(() -> restClient.post().uri("/projects")
                .headers(this::applyForwardedHeaders)
                .body(projectDto)
                .retrieve()
                .body(ProjectDto.class));
    }

    public List<ProjectDto> findAll(String code, String tenant) {
        log.info("[DashboardProjectClient] Forwarding findAll projects request: code={}, tenant={}", code, tenant);
        return execute(() -> restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/projects")
                        .queryParamIfPresent("code", java.util.Optional.ofNullable(code))
                        .queryParamIfPresent("tenant", java.util.Optional.ofNullable(tenant))
                        .build())
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(PROJECT_LIST_TYPE));
    }

    public ProjectDto findById(Long id) {
        log.info("[DashboardProjectClient] Forwarding findById project request: id={}", id);
        return execute(() -> restClient.get().uri("/projects/{id}", id)
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(ProjectDto.class));
    }

    public ProjectDto update(Long id, ProjectDto projectDto) {
        log.info("[DashboardProjectClient] Forwarding update project request: id={}, code={}, tenant={}, tenantId={}",
                id, projectDto.getCode(), projectDto.getTenant(), projectDto.getTenantId());
        return execute(() -> restClient.put().uri("/projects/{id}", id)
                .headers(this::applyForwardedHeaders)
                .body(projectDto)
                .retrieve()
                .body(ProjectDto.class));
    }

    public void delete(Long id) {
        log.info("[DashboardProjectClient] Forwarding delete project request: id={}", id);
        executeVoid(() -> restClient.delete().uri("/projects/{id}", id)
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .toBodilessEntity());
    }

    private void applyForwardedHeaders(HttpHeaders headers) {
        HttpServletRequest currentRequest = resolveCurrentRequest();
        if (currentRequest == null) {
            log.warn("[DashboardProjectClient] No current request available, no headers forwarded");
            return;
        }

        copyHeader(currentRequest, headers, HttpHeaders.AUTHORIZATION);
        copyHeader(currentRequest, headers, "X-Selected-Role");
        copyHeader(currentRequest, headers, "X-Selected-Client");

        log.info("[DashboardProjectClient] Forwarded headers authorizationPresent={} selectedRole={} selectedClient={}",
                headers.containsKey(HttpHeaders.AUTHORIZATION),
                headers.getFirst("X-Selected-Role"),
                headers.getFirst("X-Selected-Client"));
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
            log.error("[DashboardProjectClient] Downstream response error status={} body={}",
                    exception.getStatusCode(), exception.getResponseBodyAsString(), exception);
            throw new ResponseStatusException(exception.getStatusCode(), buildDownstreamMessage(exception), exception);
        } catch (RestClientException exception) {
            log.error("[DashboardProjectClient] Downstream connectivity error", exception);
            throw new ResponseStatusException(BAD_GATEWAY, SERVICE_UNAVAILABLE_MESSAGE, exception);
        }
    }

    private void executeVoid(RestVoidCall call) {
        try {
            call.execute();
        } catch (RestClientResponseException exception) {
            log.error("[DashboardProjectClient] Downstream void response error status={} body={}",
                    exception.getStatusCode(), exception.getResponseBodyAsString(), exception);
            throw new ResponseStatusException(exception.getStatusCode(), buildDownstreamMessage(exception), exception);
        } catch (RestClientException exception) {
            log.error("[DashboardProjectClient] Downstream void connectivity error", exception);
            throw new ResponseStatusException(BAD_GATEWAY, SERVICE_UNAVAILABLE_MESSAGE, exception);
        }
    }

    private String buildDownstreamMessage(RestClientResponseException exception) {
        String responseBody = exception.getResponseBodyAsString();
        if (responseBody == null || responseBody.isBlank()) {
            return "Errore restituito da QTMDashboard durante la gestione progetti";
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