package com.qtm.external.client;

import com.qtm.commonlib.dto.HospitalOverviewDto;
import com.qtm.commonlib.dto.StructureDepartmentOverviewDto;
import com.qtm.commonlib.dto.StructureDepartmentSourceDto;
import com.qtm.tenants.structure.dto.StructureDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Client REST per le operazioni sulle strutture tenant ancora gestite da Dashboard. */
@Component
public class StructureClient {

    private static final ParameterizedTypeReference<List<StructureDepartmentOverviewDto>> DEPARTMENT_OVERVIEW_LIST_TYPE = new ParameterizedTypeReference<>() { };
        private static final ParameterizedTypeReference<List<HospitalOverviewDto>> HOSPITAL_OVERVIEW_LIST_TYPE = new ParameterizedTypeReference<>() { };
        private static final ParameterizedTypeReference<List<StructureDepartmentSourceDto>> STRUCTURE_DEPARTMENT_LIST_TYPE = new ParameterizedTypeReference<>() { };

    private final RestClient restClient;
    private final String dashboardApiBaseUrl;

    public StructureClient(
            RestClient.Builder restClientBuilder,
            @Value("${qtm.dashboard.api-base-url}") String dashboardApiBaseUrl
    ) {
        this.restClient = restClientBuilder.baseUrl(dashboardApiBaseUrl).build();
        this.dashboardApiBaseUrl = dashboardApiBaseUrl;
    }

    public List<StructureDepartmentOverviewDto> findDepartmentOverview(
            String regionCode,
            String aslCode,
            String structureCode,
            String selectedRole
    ) {
        var uri = UriComponentsBuilder.fromUriString(dashboardApiBaseUrl + "/structure-departments/overview")
                .queryParamIfPresent("regionCode", Optional.ofNullable(regionCode))
                .queryParamIfPresent("aslCode", Optional.ofNullable(aslCode))
                .queryParamIfPresent("structureCode", Optional.ofNullable(structureCode))
                .build()
                .toUri();

        return restClient.get()
                .uri(uri)
                .headers(headers -> RequestContextHeaderForwarder.forward(headers, selectedRole))
                .retrieve()
                .body(DEPARTMENT_OVERVIEW_LIST_TYPE);
    }

    public List<HospitalOverviewDto> findHospitalOverview(String regionCode, String aslCode) {
        var uri = UriComponentsBuilder.fromUriString(dashboardApiBaseUrl + "/hospital/overview")
                .queryParamIfPresent("regionCode", Optional.ofNullable(regionCode))
                .queryParamIfPresent("aslCode", Optional.ofNullable(aslCode))
                .build()
                .toUri();

        return restClient.get()
                .uri(uri)
                .headers(RequestContextHeaderForwarder::forward)
                .retrieve()
                .body(HOSPITAL_OVERVIEW_LIST_TYPE);
    }

    public List<StructureDepartmentSourceDto> findDepartmentsByStructureCode(String structureCode) {
        var uri = UriComponentsBuilder.fromUriString(dashboardApiBaseUrl + "/structure-departments/by-structure")
                .queryParam("codiceStruttura", structureCode)
                .build()
                .toUri();

        return restClient.get()
                .uri(uri)
                .headers(RequestContextHeaderForwarder::forward)
                .retrieve()
                .body(STRUCTURE_DEPARTMENT_LIST_TYPE);
    }

    public StructureDto create(StructureDto structureDto, String selectedRole) {
        return restClient.post()
                .uri("/hospital")
                .headers(headers -> RequestContextHeaderForwarder.forward(headers, selectedRole))
                .body(structureDto)
                .retrieve()
                .body(StructureDto.class);
    }

    public StructureDto update(Long id, StructureDto structureDto, String selectedRole) {
        return restClient.put()
                .uri("/hospital/{id}", id)
                .headers(headers -> RequestContextHeaderForwarder.forward(headers, selectedRole))
                .body(structureDto)
                .retrieve()
                .body(StructureDto.class);
    }

    public void delete(Long id, String selectedRole) {
        restClient.delete()
                .uri("/hospital/{id}", id)
                .headers(headers -> RequestContextHeaderForwarder.forward(headers, selectedRole))
                .retrieve()
                .toBodilessEntity();
    }

    public StructureDto associate(Map<String, Object> body, String selectedRole) {
        return restClient.post()
                .uri("/hospital/associate")
                .headers(headers -> RequestContextHeaderForwarder.forward(headers, selectedRole))
                .body(body)
                .retrieve()
                .body(StructureDto.class);
    }

    public void deactivate(Long id, String selectedRole) {
        restClient.post()
                .uri("/hospital/{id}/deactivate", id)
                .headers(headers -> RequestContextHeaderForwarder.forward(headers, selectedRole))
                .retrieve()
                .toBodilessEntity();
    }
}