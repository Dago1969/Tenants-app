package com.qtm.tenants.structure.service;

import com.qtm.tenants.structure.dto.HospitalOverviewDto;
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
import java.util.Objects;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;

/**
 * Client REST verso QTMDB per recuperare l'elenco HOSPITAL associati in centrale.
 */
@Service
@Slf4j
public class DashboardHospitalClient {

    private static final ParameterizedTypeReference<List<HospitalOverviewDto>> HOSPITAL_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final String SERVICE_UNAVAILABLE_MESSAGE = "Servizio HOSPITAL QTMDB non disponibile";

    private final RestClient restClient;

    public DashboardHospitalClient(
            RestClient.Builder restClientBuilder,
            @Value("${qtm.dashboard.api-base-url}") String dashboardApiBaseUrl
    ) {
        this.restClient = restClientBuilder.baseUrl(Objects.requireNonNull(dashboardApiBaseUrl, "qtm.dashboard.api-base-url mancante")).build();
        log.info("[DashboardHospitalClient] Configured with dashboardApiBaseUrl={}", dashboardApiBaseUrl);
    }

    public List<HospitalOverviewDto> findAllAssociated() {
        return execute(() -> restClient.get()
                .uri("/hospital/overview")
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(HOSPITAL_LIST_TYPE));
    }

    public HospitalOverviewDto findById(Long id) {
        return execute(() -> restClient.get()
                .uri("/hospital/{id}", id)
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(HospitalOverviewDto.class));
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
            throw new ResponseStatusException(exception.getStatusCode(), buildDownstreamMessage(exception), exception);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(BAD_GATEWAY, SERVICE_UNAVAILABLE_MESSAGE, exception);
        }
    }

    private String buildDownstreamMessage(RestClientResponseException exception) {
        String responseBody = exception.getResponseBodyAsString();
        if (responseBody == null || responseBody.isBlank()) {
            return "Errore restituito da QTMDB durante il caricamento degli Ospedali";
        }
        return responseBody;
    }

    @FunctionalInterface
    private interface RestCall<T> {
        T execute();
    }
}
