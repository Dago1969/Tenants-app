package com.qtm.tenants.user.service;

import com.qtm.commonlib.dto.UserRoleProjectDto;
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
 * Client REST verso QTMDB per l'associazione utente-tenant-ruolo-progetto.
 */
@Service
@Slf4j
public class DashboardUserRoleProjectClient {

    private static final ParameterizedTypeReference<List<UserRoleProjectDto>> USER_ROLE_PROJECT_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final String SERVICE_UNAVAILABLE_MESSAGE = "Servizio user-role-project QTMDB non disponibile";

    private final RestClient restClient;

    public DashboardUserRoleProjectClient(
            RestClient.Builder restClientBuilder,
            @Value("${qtm.dashboard.api-base-url}") String dashboardApiBaseUrl
    ) {
        this.restClient = restClientBuilder.baseUrl(dashboardApiBaseUrl).build();
    }

    public List<UserRoleProjectDto> findByUserAndTenant(Long userId, Long tenantId) {
        return execute(() -> restClient.get()
                .uri("/user-role-project/user/{userId}/tenant/{tenantId}", userId, tenantId)
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(USER_ROLE_PROJECT_LIST_TYPE));
    }

    public UserRoleProjectDto create(UserRoleProjectDto dto) {
        return execute(() -> restClient.post()
                .uri("/user-role-project")
                .headers(this::applyForwardedHeaders)
                .body(dto)
                .retrieve()
                .body(UserRoleProjectDto.class));
    }

    public void delete(Long userId, Long tenantId, String roleId, String projectId) {
        executeVoid(() -> restClient.delete()
                .uri("/user-role-project/user/{userId}/tenant/{tenantId}/role/{roleId}/project/{projectId}", userId, tenantId, roleId, projectId)
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
        copyHeader(currentRequest, headers, "X-Selected-Project");
    }

    private void copyHeader(HttpServletRequest request, HttpHeaders headers, String headerName) {
        String value = request.getHeader(headerName);
        if (value != null && !value.isBlank()) {
            headers.set(headerName, value.trim());
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
            log.error("[DashboardUserRoleProjectClient] downstream error status={} body={}", exception.getStatusCode(), exception.getResponseBodyAsString(), exception);
            throw new ResponseStatusException(exception.getStatusCode(), buildDownstreamMessage(exception), exception);
        } catch (RestClientException exception) {
            log.error("[DashboardUserRoleProjectClient] downstream unavailable", exception);
            throw new ResponseStatusException(BAD_GATEWAY, SERVICE_UNAVAILABLE_MESSAGE, exception);
        }
    }

    private void executeVoid(RestVoidCall call) {
        try {
            call.execute();
        } catch (RestClientResponseException exception) {
            log.error("[DashboardUserRoleProjectClient] downstream void error status={} body={}", exception.getStatusCode(), exception.getResponseBodyAsString(), exception);
            throw new ResponseStatusException(exception.getStatusCode(), buildDownstreamMessage(exception), exception);
        } catch (RestClientException exception) {
            log.error("[DashboardUserRoleProjectClient] downstream unavailable on void call", exception);
            throw new ResponseStatusException(BAD_GATEWAY, SERVICE_UNAVAILABLE_MESSAGE, exception);
        }
    }

    private String buildDownstreamMessage(RestClientResponseException exception) {
        String responseBody = exception.getResponseBodyAsString();
        if (responseBody == null || responseBody.isBlank()) {
            return "Errore restituito da QTMDB durante la gestione user-role-project";
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