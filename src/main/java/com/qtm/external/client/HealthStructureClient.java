package com.qtm.external.client;

import com.qtm.commonlib.dto.ASLDto;
import com.qtm.commonlib.dto.DepartmentDto;
import com.qtm.commonlib.dto.HospitalDto;
import com.qtm.commonlib.dto.StructureDepartmentSourceDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Optional;

/** Client REST per il catalogo ASL, ospedali e reparti gestito da Health Structure. */
@Component
public class HealthStructureClient {

    private static final ParameterizedTypeReference<List<ASLDto>> ASL_LIST_TYPE = new ParameterizedTypeReference<>() { };
    private static final ParameterizedTypeReference<List<HospitalDto>> HOSPITAL_LIST_TYPE = new ParameterizedTypeReference<>() { };
    private static final ParameterizedTypeReference<List<StructureDepartmentSourceDto>> DEPARTMENT_LIST_TYPE = new ParameterizedTypeReference<>() { };

    private final RestClient restClient;
    private final String healthStructureServiceUrl;

    public HealthStructureClient(
            RestClient.Builder restClientBuilder,
            @Value("${services.qtm-health-structure-service.url}") String healthStructureServiceUrl
    ) {
        this.restClient = restClientBuilder.baseUrl(healthStructureServiceUrl).build();
        this.healthStructureServiceUrl = healthStructureServiceUrl;
    }

    public List<ASLDto> findAsl() {
        return restClient.get()
                .uri("/asl")
                .headers(RequestContextHeaderForwarder::forward)
                .retrieve()
                .body(ASL_LIST_TYPE);
    }

    public ASLDto findAslById(Long id) {
        return restClient.get()
                .uri("/asl/{id}", id)
                .headers(RequestContextHeaderForwarder::forward)
                .retrieve()
                .body(ASLDto.class);
    }

    public ASLDto updateAsl(Long id, ASLDto dto) {
        return restClient.put()
                .uri("/asl/{id}", id)
                .headers(RequestContextHeaderForwarder::forward)
                .body(dto)
                .retrieve()
                .body(ASLDto.class);
    }

    public void deleteAsl(Long id) {
        restClient.delete()
                .uri("/asl/{id}", id)
                .headers(RequestContextHeaderForwarder::forward)
                .retrieve()
                .toBodilessEntity();
    }

    public List<HospitalDto> findHospitals() {
        return restClient.get()
                .uri("/ospedali")
                .headers(RequestContextHeaderForwarder::forward)
                .retrieve()
                .body(HOSPITAL_LIST_TYPE);
    }

    public HospitalDto findHospitalById(Long id) {
        return restClient.get()
                .uri("/ospedali/{id}", id)
                .headers(RequestContextHeaderForwarder::forward)
                .retrieve()
                .body(HospitalDto.class);
    }

    public List<StructureDepartmentSourceDto> findDepartmentsByStructureCode(String structureCode) {
        var uri = UriComponentsBuilder.fromUriString(healthStructureServiceUrl + "/dipartimenti")
                .queryParamIfPresent("codiceStruttura", Optional.ofNullable(structureCode))
                .build()
                .toUri();

        return restClient.get()
                .uri(uri)
                .headers(RequestContextHeaderForwarder::forward)
                .retrieve()
                .body(DEPARTMENT_LIST_TYPE);
    }

    public DepartmentDto findDepartmentById(Long id) {
        return findDepartmentsByStructureCode(null).stream()
                .filter(department -> id.equals(department.getId()))
                .findFirst()
                .map(department -> DepartmentDto.builder()
                        .id(department.getId())
                        .reparto(department.getCodiceDisciplina())
                        .areaFunzionale(department.getDescrizioneDisciplina())
                        .build())
                .orElse(null);
    }
}