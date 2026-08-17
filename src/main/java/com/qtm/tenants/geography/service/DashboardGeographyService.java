package com.qtm.tenants.geography.service;

import com.qtm.tenants.geography.dto.DashboardCityDto;
import com.qtm.tenants.geography.dto.DashboardProvinceDto;
import com.qtm.tenants.geography.dto.DashboardRegionDto;
import com.qtm.tenants.geography.dto.GeographicOptionDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

/**
 * Proxy backend verso QTMDashboard per esporre a TENANTS-APP le anagrafiche geografiche.
 */
@Service
@Slf4j
public class DashboardGeographyService {

    private static final ParameterizedTypeReference<List<DashboardRegionDto>> REGION_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final ParameterizedTypeReference<List<DashboardProvinceDto>> PROVINCE_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final ParameterizedTypeReference<List<DashboardCityDto>> CITY_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final String SERVICE_UNAVAILABLE_MESSAGE = "Servizio geografia QTMDashboard non disponibile";
    private static final String MISSING_AUTHORIZATION_MESSAGE = "Token non presente per interrogare QTMDashboard";

    private final RestClient restClient;

    public DashboardGeographyService(
            RestClient.Builder restClientBuilder,
            @Value("${qtm.dashboard.api-base-url}") String dashboardApiBaseUrl
    ) {
        this.restClient = restClientBuilder
                .baseUrl(dashboardApiBaseUrl)
                .build();
    }

    public List<GeographicOptionDto> findRegions() {
        return executeListRequest("/regions", REGION_LIST_TYPE).stream()
                .map(region -> new GeographicOptionDto(region.getId(), region.getName()))
                .toList();
    }

    public List<GeographicOptionDto> findProvincesByRegionId(Long regionId) {
        return executeListRequest("/provinces/by-region/" + regionId, PROVINCE_LIST_TYPE).stream()
                .map(province -> new GeographicOptionDto(province.getId(), province.getName()))
                .toList();
    }

    public List<GeographicOptionDto> findCitiesByProvinceId(Long provinceId) {
        log.info("[DashboardGeographyService] Loading cities for provinceId={}", provinceId);
        return executeListRequest("/cities/options/by-province/" + provinceId, CITY_LIST_TYPE).stream()
                .map(city -> new GeographicOptionDto(city.getId(), city.getName()))
                .toList();
    }

    private <T> List<T> executeListRequest(String uri, ParameterizedTypeReference<List<T>> bodyType) {
        try {
            RestClient.RequestHeadersSpec<?> request = restClient.get().uri(uri).headers(this::applyForwardedHeaders);
            String authorizationHeader = resolveCurrentHeader(HttpHeaders.AUTHORIZATION);
            if (authorizationHeader == null || authorizationHeader.isBlank()) {
                throw new ResponseStatusException(UNAUTHORIZED, MISSING_AUTHORIZATION_MESSAGE);
            }

            List<T> response = request.retrieve().body(bodyType);
            return response == null ? List.of() : response;
        } catch (RestClientResponseException exception) {
            log.error("[DashboardGeographyService] Downstream response error uri={} status={} body={}",
                    uri, exception.getStatusCode(), exception.getResponseBodyAsString(), exception);
            throw new ResponseStatusException(exception.getStatusCode(), buildDownstreamMessage(exception), exception);
        } catch (RestClientException exception) {
            log.error("[DashboardGeographyService] Downstream connectivity error uri={}", uri, exception);
            throw new ResponseStatusException(BAD_GATEWAY, SERVICE_UNAVAILABLE_MESSAGE, exception);
        }
    }

    private void applyForwardedHeaders(HttpHeaders headers) {
        HttpServletRequest currentRequest = resolveCurrentRequest();
        if (currentRequest == null) {
            log.warn("[DashboardGeographyService] No current request available, no headers forwarded");
            return;
        }

        copyHeader(currentRequest, headers, HttpHeaders.AUTHORIZATION);
        copyHeader(currentRequest, headers, "X-Selected-Role");
        copyHeader(currentRequest, headers, "X-Selected-Client");
        copyHeader(currentRequest, headers, "X-Selected-Project");

        log.info("[DashboardGeographyService] Forwarded headers authorizationPresent={} selectedRole={} selectedClient={} selectedProject={}",
                headers.containsKey(HttpHeaders.AUTHORIZATION),
                headers.getFirst("X-Selected-Role"),
                headers.getFirst("X-Selected-Client"),
                headers.getFirst("X-Selected-Project"));
    }

    private void copyHeader(HttpServletRequest request, HttpHeaders headers, String headerName) {
        String value = request.getHeader(headerName);
        if (value != null && !value.isBlank()) {
            headers.set(headerName, value.trim());
        }
    }

    private String buildDownstreamMessage(RestClientResponseException exception) {
        String responseBody = exception.getResponseBodyAsString();
        if (responseBody == null || responseBody.isBlank()) {
            return "Errore restituito da QTMDashboard durante il caricamento della geografia";
        }
        return responseBody;
    }

    private String resolveCurrentHeader(String headerName) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return null;
        }

        HttpServletRequest request = attributes.getRequest();
        return request.getHeader(headerName);
    }

    private HttpServletRequest resolveCurrentRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes == null ? null : attributes.getRequest();
    }
}