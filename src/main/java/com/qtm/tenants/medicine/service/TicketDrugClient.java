package com.qtm.tenants.medicine.service;

import com.qtm.commonlib.dto.FarmacoDto;
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
 * Client REST verso TICKET per consultare il catalogo farmaci condiviso AIFA.
 */
@Service
public class TicketDrugClient {

    private static final ParameterizedTypeReference<List<FarmacoDto>> DRUG_LIST_TYPE = new ParameterizedTypeReference<>() {
    };

    private final RestClient restClient;

    public TicketDrugClient(
            RestClient.Builder restClientBuilder,
            @Value("${services.ticket-service.url}") String ticketServiceUrl
    ) {
        this.restClient = restClientBuilder.baseUrl(ticketServiceUrl).build();
    }

    public List<FarmacoDto> search(String query) {
        try {
            List<FarmacoDto> response = restClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/api/tenants/ticket/drugs/search")
                            .queryParam("query", query)
                            .build())
                    .headers(this::applyForwardedHeaders)
                    .retrieve()
                    .body(DRUG_LIST_TYPE);
            return response == null ? List.of() : response;
        } catch (RestClientResponseException exception) {
            String message = exception.getResponseBodyAsString();
            throw new ResponseStatusException(exception.getStatusCode(),
                    message == null || message.isBlank() ? "Errore restituito da TICKET" : message, exception);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(BAD_GATEWAY, "Servizio farmaci TICKET non disponibile", exception);
        }
    }

    private void applyForwardedHeaders(HttpHeaders headers) {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            HttpServletRequest request = attributes.getRequest();
            copyHeader(request, headers, HttpHeaders.AUTHORIZATION);
            copyHeader(request, headers, "X-Selected-Role");
            copyHeader(request, headers, "X-Selected-Client");
            copyHeader(request, headers, "X-Selected-Project");
        }
    }

    private void copyHeader(HttpServletRequest request, HttpHeaders headers, String name) {
        String value = request.getHeader(name);
        if (value != null && !value.isBlank()) {
            headers.set(name, value.trim());
        }
    }
}