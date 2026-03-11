package com.qtm.tenants.patient.service;

import com.qtm.tenants.patient.dto.PatientDto;
import jakarta.servlet.http.HttpServletRequest;
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
 * Client REST verso QTMDashboard per la persistenza centralizzata dei pazienti.
 */
@Service
public class DashboardPatientClient {

    private static final ParameterizedTypeReference<List<PatientDto>> PATIENT_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final String SERVICE_UNAVAILABLE_MESSAGE = "Servizio pazienti QTMDashboard non disponibile";

    private final RestClient restClient;

    public DashboardPatientClient(
            RestClient.Builder restClientBuilder,
            @Value("${qtm.dashboard.api-base-url}") String dashboardApiBaseUrl
    ) {
        this.restClient = restClientBuilder
                .baseUrl(dashboardApiBaseUrl)
                .build();
    }

    public PatientDto create(PatientDto patientDto) {
        return execute(() -> restClient.post().uri("/patients")
                .headers(this::applyForwardedHeaders)
                .body(patientDto)
                .retrieve()
                .body(PatientDto.class));
    }

    public List<PatientDto> findAll() {
        return execute(() -> restClient.get().uri("/patients")
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(PATIENT_LIST_TYPE));
    }

    public PatientDto findById(Long id) {
        return execute(() -> restClient.get().uri("/patients/{id}", id)
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(PatientDto.class));
    }

    public PatientDto update(Long id, PatientDto patientDto) {
        return execute(() -> restClient.put().uri("/patients/{id}", id)
                .headers(this::applyForwardedHeaders)
                .body(patientDto)
                .retrieve()
                .body(PatientDto.class));
    }

    public void delete(Long id) {
        executeVoid(() -> restClient.delete().uri("/patients/{id}", id)
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
            T result = call.execute();
            if (result == null && PATIENT_LIST_TYPE.getType() != null) {
                return result;
            }
            return result;
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(exception.getStatusCode(), buildDownstreamMessage(exception), exception);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(BAD_GATEWAY, SERVICE_UNAVAILABLE_MESSAGE, exception);
        }
    }

    private void executeVoid(RestVoidCall call) {
        try {
            call.execute();
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(exception.getStatusCode(), buildDownstreamMessage(exception), exception);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(BAD_GATEWAY, SERVICE_UNAVAILABLE_MESSAGE, exception);
        }
    }

    private String buildDownstreamMessage(RestClientResponseException exception) {
        String responseBody = exception.getResponseBodyAsString();
        if (responseBody == null || responseBody.isBlank()) {
            return "Errore restituito da QTMDashboard durante la gestione pazienti";
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