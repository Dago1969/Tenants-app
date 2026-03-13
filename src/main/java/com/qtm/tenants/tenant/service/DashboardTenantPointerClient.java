package com.qtm.tenants.tenant.service;

import com.qtm.tenants.tenant.dto.TenantAppPointerDto;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;

/**
 * Client REST verso QTMDashboard per recuperare il tenant pointer dal client code corrente.
 */
@Service
@Slf4j
public class DashboardTenantPointerClient {

    private static final String SERVICE_UNAVAILABLE_MESSAGE = "Servizio tenant pointer QTMDashboard non disponibile";

    private final RestClient restClient;

    public DashboardTenantPointerClient(
            RestClient.Builder restClientBuilder,
            @Value("${qtm.dashboard.api-base-url}") String dashboardApiBaseUrl
    ) {
        this.restClient = restClientBuilder
                .baseUrl(dashboardApiBaseUrl)
                .build();
        log.info("[DashboardTenantPointerClient] Configured with dashboardApiBaseUrl={}", dashboardApiBaseUrl);
    }

    public TenantAppPointerDto findByClientCode(String clientCode) {
        log.info("[DashboardTenantPointerClient] Forwarding tenant pointer lookup for clientCode={}", clientCode);
        return execute(() -> restClient.get()
                .uri("/tenant-app-pointers/by-client/{clientCode}", clientCode)
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(TenantAppPointerDto.class));
    }

    private void applyForwardedHeaders(HttpHeaders headers) {
        HttpServletRequest currentRequest = resolveCurrentRequest();
        if (currentRequest == null) {
            log.warn("[DashboardTenantPointerClient] No current request available, no headers forwarded");
            return;
        }

        copyHeader(currentRequest, headers, HttpHeaders.AUTHORIZATION);
        copyHeader(currentRequest, headers, "X-Selected-Role");
        copyHeader(currentRequest, headers, "X-Selected-Client");

        log.info("[DashboardTenantPointerClient] Forwarded headers authorizationPresent={} selectedRole={} selectedClient={}",
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
            log.error("[DashboardTenantPointerClient] Downstream response error status={} body={}",
                    exception.getStatusCode(), exception.getResponseBodyAsString(), exception);
            throw new ResponseStatusException(exception.getStatusCode(), buildDownstreamMessage(exception), exception);
        } catch (RestClientException exception) {
            log.error("[DashboardTenantPointerClient] Downstream connectivity error", exception);
            throw new ResponseStatusException(BAD_GATEWAY, SERVICE_UNAVAILABLE_MESSAGE, exception);
        }
    }

    private String buildDownstreamMessage(RestClientResponseException exception) {
        String responseBody = exception.getResponseBodyAsString();
        if (responseBody == null || responseBody.isBlank()) {
            return "Errore restituito da QTMDashboard durante la lettura del tenant pointer";
        }
        return responseBody;
    }

    @FunctionalInterface
    private interface RestCall<T> {
        T execute();
    }
}