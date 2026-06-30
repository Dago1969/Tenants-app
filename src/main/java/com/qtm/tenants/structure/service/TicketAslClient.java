package com.qtm.tenants.structure.service;

import com.qtm.commonlib.dto.ASLDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;

/**
 * Client REST verso QTMTicket per leggere il dettaglio anagrafico completo delle ASL.
 */
@Service
@Slf4j
public class TicketAslClient {

    private static final String SERVICE_UNAVAILABLE_MESSAGE = "Servizio ASL QTMTicket non disponibile";

    private final RestClient restClient;

    public TicketAslClient(
            RestClient.Builder restClientBuilder,
            @Value("${qtm.ticket.api-base-url:http://localhost:8084/api/ticket}") String ticketApiBaseUrl
    ) {
        this.restClient = restClientBuilder.baseUrl(Objects.requireNonNull(ticketApiBaseUrl, "qtm.ticket.api-base-url mancante")).build();
        log.info("[TicketAslClient] Configured with ticketApiBaseUrl={}", ticketApiBaseUrl);
    }

    public ASLDto findById(Long id) {
        return execute(() -> restClient.get()
                .uri("/asl/{id}", id)
                .retrieve()
                .body(ASLDto.class));
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
            return "Errore restituito da QTMTicket durante il caricamento delle ASL";
        }
        return responseBody;
    }

    @FunctionalInterface
    private interface RestCall<T> {
        T execute();
    }
}