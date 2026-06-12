package com.qtm.tenants.ticket.client;

import com.qtm.tenants.ticket.dto.TicketDto;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Optional;

/**
 * Client per comunicare con QTMTicket.
 * Passa automaticamente il JWT del contesto di sicurezza corrente.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TicketClient {

    private final RestClient restClient;

    @Value("${qtm.ticket.base-url:http://localhost:8084/api/ticket}")
    private String ticketBaseUrl;

    /**
     * Crea un nuovo ticket su QTMTicket passando il JWT.
     */
    public TicketDto createTicket(TicketDto ticketDto) {
        log.info("Creazione ticket su QTMTicket: {}", ticketDto);
        return restClient.post()
                .uri(ticketBaseUrl + "/tickets")
                .header(HttpHeaders.AUTHORIZATION, resolveAuthorizationHeader())
                .body(ticketDto)
                .retrieve()
                .body(TicketDto.class);
    }

            /**
             * Ricerca ticket su QTMTicket con filtri multipli.
             */
            public Object searchTickets(
                String realm,
                String project,
                String patientId,
                String status,
                Integer page,
                Integer size,
                String sort
            ) {
            URI searchUri = UriComponentsBuilder.fromHttpUrl(ticketBaseUrl + "/tickets/search")
                .queryParamIfPresent("realm", Optional.ofNullable(realm))
                .queryParamIfPresent("project", Optional.ofNullable(project))
                .queryParamIfPresent("patientId", Optional.ofNullable(patientId))
                .queryParamIfPresent("status", Optional.ofNullable(status))
                .queryParamIfPresent("page", Optional.ofNullable(page))
                .queryParamIfPresent("size", Optional.ofNullable(size))
                .queryParamIfPresent("sort", Optional.ofNullable(sort))
                .build(true)
                .toUri();

            log.info("Ricerca ticket su QTMTicket con URI: {}", searchUri);
            return restClient.get()
                .uri(searchUri)
                .header(HttpHeaders.AUTHORIZATION, resolveAuthorizationHeader())
                .retrieve()
                .body(Object.class);
            }

    /**
     * Recupera un ticket da QTMTicket per ID.
     */
    public TicketDto getTicketById(Long id) {
        log.info("Recupero ticket ID: {} da QTMTicket", id);
        return restClient.get()
                .uri(ticketBaseUrl + "/tickets/{id}", id)
            .header(HttpHeaders.AUTHORIZATION, resolveAuthorizationHeader())
                .retrieve()
                .body(TicketDto.class);
    }

    /**
     * Aggiorna un ticket su QTMTicket.
     */
    public TicketDto updateTicket(Long id, TicketDto ticketDto) {
        log.info("Aggiornamento ticket ID: {} su QTMTicket", id);
        return restClient.put()
                .uri(ticketBaseUrl + "/tickets/{id}", id)
            .header(HttpHeaders.AUTHORIZATION, resolveAuthorizationHeader())
                .body(ticketDto)
                .retrieve()
                .body(TicketDto.class);
    }

    /**
     * Elimina un ticket su QTMTicket.
     */
    public void deleteTicket(Long id) {
        log.info("Eliminazione ticket ID: {} su QTMTicket", id);
        restClient.delete()
                .uri(ticketBaseUrl + "/tickets/{id}", id)
            .header(HttpHeaders.AUTHORIZATION, resolveAuthorizationHeader())
                .retrieve()
                .toBodilessEntity();
    }

    /**
     * Cambia lo status di un ticket su QTMTicket (PATCH).
     */
    public TicketDto changeStatus(Long id, String newStatus) {
        log.info("Cambio status ticket ID: {} -> {} su QTMTicket", id, newStatus);
        return restClient.patch()
                .uri(ticketBaseUrl + "/tickets/{id}/status/{newStatus}", id, newStatus)
            .header(HttpHeaders.AUTHORIZATION, resolveAuthorizationHeader())
                .retrieve()
                .body(TicketDto.class);
    }

    /**
     * Recupera il token JWT dal contesto di sicurezza corrente.
     * Se non disponibile, lancia un'eccezione.
     */
    private String resolveAuthorizationHeader() {
        HttpServletRequest currentRequest = resolveCurrentRequest();
        if (currentRequest != null) {
            String authorization = currentRequest.getHeader(HttpHeaders.AUTHORIZATION);
            if (authorization != null && !authorization.isBlank()) {
                return authorization.trim();
            }
        }

        return getJwtToken()
                .map(token -> "Bearer " + token)
                .orElseThrow(() -> new IllegalStateException("JWT token non disponibile nel contesto di sicurezza"));
    }

    /**
     * Estrae il JWT dal contesto di sicurezza.
     */
    private Optional<String> getJwtToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            return Optional.of(jwt.getTokenValue());
        }

        if (authentication != null && authentication.getCredentials() instanceof Jwt jwt) {
            return Optional.of(jwt.getTokenValue());
        }
        
        return Optional.empty();
    }

    private HttpServletRequest resolveCurrentRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes == null ? null : attributes.getRequest();
    }
}
