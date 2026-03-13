package com.qtm.tenants.user.client;

import com.qtm.commonlib.dto.UserDto;
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
 * Client REST verso QTMDashboard per la persistenza centralizzata degli utenti.
 */
@Service
@Slf4j
public class UserRemoteClient {

    private static final ParameterizedTypeReference<List<UserDto>> USER_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final String SERVICE_UNAVAILABLE_MESSAGE = "Servizio utenti QTMDashboard non disponibile";

    private final RestClient restClient;

    public UserRemoteClient(
            RestClient.Builder restClientBuilder,
            @Value("${qtm.dashboard.api-base-url}") String dashboardApiBaseUrl
    ) {
        this.restClient = restClientBuilder
                .baseUrl(dashboardApiBaseUrl)
                .build();
    }

    public UserDto create(UserDto userDto) {
        log.debug("[UserRemoteClient] create user username={}", userDto.getUsername());
        return execute(() -> restClient.post().uri("/users")
                .headers(this::applyForwardedHeaders)
                .body(userDto)
                .retrieve()
                .body(UserDto.class));
    }

    public List<UserDto> findAll() {
        log.debug("[UserRemoteClient] findAll users");
        return execute(() -> restClient.get().uri("/users")
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(USER_LIST_TYPE));
    }

        public List<UserDto> search(String username, String email, String roleId, Long structureId, Boolean enabled) {
        log.debug("[UserRemoteClient] search users username={}, email={}, roleId={}, structureId={}, enabled={}",
            username,
            email,
            roleId,
            structureId,
            enabled);
        return execute(() -> restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/users/search")
                        .queryParamIfPresent("username", java.util.Optional.ofNullable(username))
                .queryParamIfPresent("email", java.util.Optional.ofNullable(email))
                        .queryParamIfPresent("roleId", java.util.Optional.ofNullable(roleId))
                        .queryParamIfPresent("structureId", java.util.Optional.ofNullable(structureId))
                        .queryParamIfPresent("enabled", java.util.Optional.ofNullable(enabled))
                        .build())
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(USER_LIST_TYPE));
    }

    public UserDto findById(Long id) {
        log.debug("[UserRemoteClient] find user by id={}", id);
        return execute(() -> restClient.get().uri("/users/{id}", id)
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(UserDto.class));
    }

    public UserDto update(Long id, UserDto userDto) {
        log.debug("[UserRemoteClient] update user id={}, username={}", id, userDto.getUsername());
        return execute(() -> restClient.put().uri("/users/{id}", id)
                .headers(this::applyForwardedHeaders)
                .body(userDto)
                .retrieve()
                .body(UserDto.class));
    }

    public void delete(Long id) {
        log.debug("[UserRemoteClient] delete user id={}", id);
        executeVoid(() -> restClient.delete().uri("/users/{id}", id)
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
            log.error("[UserRemoteClient] downstream error status={}, body={}", exception.getStatusCode(), exception.getResponseBodyAsString());
            throw new ResponseStatusException(exception.getStatusCode(), buildDownstreamMessage(exception), exception);
        } catch (RestClientException exception) {
            log.error("[UserRemoteClient] downstream unavailable", exception);
            throw new ResponseStatusException(BAD_GATEWAY, SERVICE_UNAVAILABLE_MESSAGE, exception);
        }
    }

    private void executeVoid(RestVoidCall call) {
        try {
            call.execute();
        } catch (RestClientResponseException exception) {
            log.error("[UserRemoteClient] downstream void error status={}, body={}", exception.getStatusCode(), exception.getResponseBodyAsString());
            throw new ResponseStatusException(exception.getStatusCode(), buildDownstreamMessage(exception), exception);
        } catch (RestClientException exception) {
            log.error("[UserRemoteClient] downstream unavailable on void call", exception);
            throw new ResponseStatusException(BAD_GATEWAY, SERVICE_UNAVAILABLE_MESSAGE, exception);
        }
    }

    private String buildDownstreamMessage(RestClientResponseException exception) {
        String responseBody = exception.getResponseBodyAsString();
        if (responseBody == null || responseBody.isBlank()) {
            return "Errore restituito da QTMDashboard durante la gestione utenti";
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
