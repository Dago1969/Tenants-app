package com.qtm.tenants.otp.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.qtm.tenants.otp.config.TwilioVerifyProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;
import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

/**
 * Client infrastrutturale verso Twilio Verify che incapsula autenticazione Basic e payload form-urlencoded.
 */
@Service
@Slf4j
public class TwilioVerifyClient {

    private final RestClient restClient;
    private final TwilioVerifyProperties properties;

    public TwilioVerifyClient(RestClient.Builder restClientBuilder, TwilioVerifyProperties properties) {
        this.restClient = restClientBuilder.baseUrl(Objects.requireNonNull(properties.getBaseUrl(), "Twilio base URL mancante")).build();
        this.properties = properties;
    }

    public TwilioVerificationResource startVerification(String destination, String channel) {
        ensureConfigured();
        log.info("[TwilioVerifyClient] startVerification serviceSid={} authMode={} destination={} channel={}",
            maskServiceSid(properties.getServiceSid()),
            authenticationMode(),
            maskPhone(destination),
            channel);
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("To", destination);
        formData.add("Channel", channel);

        return execute(() -> restClient.post()
                .uri("/Services/{serviceSid}/Verifications", properties.getServiceSid())
            .contentType(Objects.requireNonNull(MediaType.APPLICATION_FORM_URLENCODED))
                .headers(this::applyBasicAuth)
                .body(formData)
                .retrieve()
                .body(TwilioVerificationResource.class));
    }

    public TwilioVerificationResource checkVerification(String destination, String code) {
        ensureConfigured();
        log.info("[TwilioVerifyClient] checkVerification serviceSid={} authMode={} destination={} codeLength={}",
            maskServiceSid(properties.getServiceSid()),
            authenticationMode(),
            maskPhone(destination),
            code == null ? 0 : code.trim().length());
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("To", destination);
        formData.add("Code", code);

        return execute(() -> restClient.post()
                .uri("/Services/{serviceSid}/VerificationCheck", properties.getServiceSid())
            .contentType(Objects.requireNonNull(MediaType.APPLICATION_FORM_URLENCODED))
                .headers(this::applyBasicAuth)
                .body(formData)
                .retrieve()
                .body(TwilioVerificationResource.class));
    }

    public boolean isEnabledAndConfigured() {
        return properties.isReady();
    }

    @SuppressWarnings("null")
    private void applyBasicAuth(HttpHeaders headers) {
        if (properties.hasAccountCredentials()) {
            String accountSid = requiredValue(properties.getAccountSid(), "Twilio account SID mancante").trim();
            String authToken = requiredValue(properties.getAuthToken(), "Twilio auth token mancante").trim();
            headers.setBasicAuth(accountSid, authToken);
            return;
        }

        if (properties.hasApiKeyCredentials()) {
            String apiKey = requiredValue(properties.getApiKey(), "Twilio API key mancante").trim();
            String apiSecret = requiredValue(properties.getApiSecret(), "Twilio API secret mancante").trim();
            headers.setBasicAuth(apiKey, apiSecret);
            return;
        }

        String accountSid = requiredValue(properties.getAccountSid(), "Twilio account SID mancante").trim();
        String authToken = requiredValue(properties.getAuthToken(), "Twilio auth token mancante").trim();
        headers.setBasicAuth(accountSid, authToken);
    }

    private String requiredValue(String value, String message) {
        return Objects.requireNonNull(value, message);
    }

    private void ensureConfigured() {
        if (!properties.isReady()) {
            log.error("[TwilioVerifyClient] Configurazione Twilio incompleta enabled={} serviceSidPresent={} apiKeyPresent={} apiSecretPresent={} accountSidPresent={} authTokenPresent={}",
                    properties.isEnabled(),
                    hasText(properties.getServiceSid()),
                    hasText(properties.getApiKey()),
                    hasText(properties.getApiSecret()),
                    hasText(properties.getAccountSid()),
                    hasText(properties.getAuthToken()));
            throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Twilio Verify non configurato in TENAPP");
        }
    }

    private TwilioVerificationResource execute(TwilioCall call) {
        try {
            TwilioVerificationResource response = call.execute();
            if (response == null) {
                throw new ResponseStatusException(BAD_GATEWAY, "Risposta vuota da Twilio Verify");
            }
            return response;
        } catch (RestClientResponseException exception) {
            log.error("[TwilioVerifyClient] verify response status={} body={}", exception.getStatusCode(), exception.getResponseBodyAsString());
            throw new ResponseStatusException(BAD_GATEWAY, buildErrorMessage(exception), exception);
        } catch (RestClientException exception) {
            log.error("[TwilioVerifyClient] verify unavailable", exception);
            throw new ResponseStatusException(BAD_GATEWAY, "Twilio Verify non raggiungibile", exception);
        }
    }

    private String buildErrorMessage(RestClientResponseException exception) {
        String body = exception.getResponseBodyAsString();
        if (body == null || body.isBlank()) {
            return "Errore restituito da Twilio Verify";
        }
        return "Twilio Verify ha restituito un errore: " + body;
    }

    private String authenticationMode() {
        return properties.hasAccountCredentials() ? "account-sid" : "api-key";
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String maskServiceSid(String serviceSid) {
        if (!hasText(serviceSid)) {
            return "";
        }
        String trimmed = serviceSid.trim();
        if (trimmed.length() <= 6) {
            return "***";
        }
        return trimmed.substring(0, 4) + "***" + trimmed.substring(trimmed.length() - 3);
    }

    private String maskPhone(String phoneNumber) {
        if (!hasText(phoneNumber)) {
            return "";
        }
        String trimmed = phoneNumber.trim();
        if (trimmed.length() <= 4) {
            return "****";
        }
        return "***" + trimmed.substring(trimmed.length() - 4);
    }

    @FunctionalInterface
    private interface TwilioCall {
        TwilioVerificationResource execute();
    }

    /**
     * Mappa minima della risposta Twilio Verify per i flussi di invio e verifica OTP.
     */
    public record TwilioVerificationResource(
            String sid,
            @JsonProperty("service_sid") String serviceSid,
            String to,
            String channel,
            String status,
            Boolean valid
    ) {
    }
}