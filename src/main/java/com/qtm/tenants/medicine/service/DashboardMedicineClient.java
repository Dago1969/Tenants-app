package com.qtm.tenants.medicine.service;

import com.qtm.commonlib.dto.MedicineDto;
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
 * Client REST verso QTMDashboard per consultare il catalogo farmaci di QTMDB.
 */
@Service
public class DashboardMedicineClient {

    private static final ParameterizedTypeReference<List<MedicineDto>> MEDICINE_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final String SERVICE_UNAVAILABLE_MESSAGE = "Servizio farmaci QTMDashboard non disponibile";

    private final RestClient restClient;

    public DashboardMedicineClient(
            RestClient.Builder restClientBuilder,
            @Value("${qtm.dashboard.api-base-url}") String dashboardApiBaseUrl
    ) {
        this.restClient = restClientBuilder
                .baseUrl(dashboardApiBaseUrl)
                .build();
    }

    public List<MedicineDto> lookup(String query) {
        return execute(() -> restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/medicines/lookup")
                        .queryParamIfPresent("query", java.util.Optional.ofNullable(query))
                        .build())
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(MEDICINE_LIST_TYPE));
    }

    public MedicineDto findByCodiceAic(String codiceAic) {
        return execute(() -> restClient.get()
                .uri("/medicines/codice-aic/{codiceAic}", codiceAic)
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(MedicineDto.class));
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
            return "Errore restituito da QTMDashboard durante la consultazione dei farmaci";
        }
        return responseBody;
    }

    @FunctionalInterface
    private interface RestCall<T> {
        T execute();
    }
}