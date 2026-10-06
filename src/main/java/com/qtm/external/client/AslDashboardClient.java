package com.qtm.external.client;

import com.qtm.commonlib.dto.ASLDto;
import com.qtm.commonlib.dto.ASLImportRequest;
import com.qtm.commonlib.dto.ASLOverviewDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Optional;

/** Client REST per importazione ASL e metadati di import ancora gestiti da Dashboard. */
@Component
public class AslDashboardClient {

    private static final ParameterizedTypeReference<List<ASLOverviewDto>> ASL_OVERVIEW_LIST_TYPE = new ParameterizedTypeReference<>() { };
    private static final ParameterizedTypeReference<List<ASLDto>> ASL_LIST_TYPE = new ParameterizedTypeReference<>() { };

    private final RestClient restClient;
    private final String dashboardApiBaseUrl;

    public AslDashboardClient(
            RestClient.Builder restClientBuilder,
            @Value("${qtm.dashboard.api-base-url}") String dashboardApiBaseUrl
    ) {
        this.restClient = restClientBuilder.baseUrl(dashboardApiBaseUrl).build();
        this.dashboardApiBaseUrl = dashboardApiBaseUrl;
    }

    public List<ASLOverviewDto> findAllWithImportStatus(String regionCode) {
        var uri = UriComponentsBuilder.fromUriString(dashboardApiBaseUrl + "/asl/overview")
                .queryParamIfPresent("regionCode", Optional.ofNullable(regionCode))
                .build()
                .toUri();

        return restClient.get()
                .uri(uri)
                .headers(RequestContextHeaderForwarder::forward)
                .retrieve()
                .body(ASL_OVERVIEW_LIST_TYPE);
    }

    public List<ASLDto> importFromSource(ASLImportRequest request) {
        return restClient.post()
                .uri("/asl/import")
                .headers(RequestContextHeaderForwarder::forward)
                .body(request)
                .retrieve()
                .body(ASL_LIST_TYPE);
    }
}