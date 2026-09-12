package com.qtm.tenants.structure.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.qtm.tenants.structure.dto.StructureDto;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Getter;
import lombok.Setter;
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

@Service
@Slf4j
public class StructureRemoteClient {

    private static final ParameterizedTypeReference<List<AslOverviewRemoteDto>> ASL_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final ParameterizedTypeReference<List<HospitalOverviewRemoteDto>> HOSPITAL_LIST_TYPE = new ParameterizedTypeReference<>() {
    };
    private static final String SERVICE_UNAVAILABLE_MESSAGE = "Servizio ASL QTMDB non disponibile";

    private final RestClient restClient;

    public StructureRemoteClient(
            RestClient.Builder restClientBuilder,
            @Value("${qtm.dashboard.api-base-url}") String dashboardApiBaseUrl
    ) {
        this.restClient = restClientBuilder
                .baseUrl(dashboardApiBaseUrl)
                .build();
        log.info("[StructureRemoteClient] Configured with dashboardApiBaseUrl={}", dashboardApiBaseUrl);
    }

    public List<StructureDto> fetchAsl() {
        List<AslOverviewRemoteDto> remoteAsls = execute(() -> restClient.get()
                .uri("/asl/overview")
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(ASL_LIST_TYPE));

        if (remoteAsls == null) {
            return List.of();
        }

        return remoteAsls.stream()
                .filter(item -> Boolean.TRUE.equals(item.getImported()))
                .map(this::toStructureDto)
                .toList();
    }

    public List<StructureDto> fetchHospitals() {
        List<HospitalOverviewRemoteDto> remoteHospitals = execute(() -> restClient.get()
                .uri("/hospital/overview")
                .headers(this::applyForwardedHeaders)
                .retrieve()
                .body(HOSPITAL_LIST_TYPE));

        if (remoteHospitals == null) {
            return List.of();
        }

        return remoteHospitals.stream()
                .filter(item -> Boolean.TRUE.equals(item.getImported()))
                .map(this::toHospitalStructureDto)
                .toList();
    }

    private StructureDto toStructureDto(AslOverviewRemoteDto asl) {
        StructureDto dto = new StructureDto();
        dto.setExternalSource("QTMDB");
        dto.setId(asl.getId());
        dto.setExternalId(asl.getId());
        dto.setCode(asl.getCodiceAzienda());
        dto.setName(asl.getDenominazioneAzienda());
        dto.setAddress(asl.getIndirizzo() == null ? "" : asl.getIndirizzo());
        dto.setProvince(asl.getProvinciaDescrizione());
        dto.setRegion(asl.getRegioneDescrizione());
        dto.setYear(asl.getAnno());
        dto.setEmail(asl.getEmail());
        dto.setPhone(asl.getTelefono());
        dto.setActive(true);
        dto.setStructureType("ASL");
        return dto;
    }

    private StructureDto toHospitalStructureDto(HospitalOverviewRemoteDto hospital) {
        StructureDto dto = new StructureDto();
        dto.setExternalSource("QTMDB");
        dto.setId(hospital.getId());
        dto.setExternalId(hospital.getId());
        dto.setCode(hospital.getCodiceStruttura());
        dto.setName(hospital.getStruttura());
        dto.setAddress(hospital.getIndirizzo() == null ? "" : hospital.getIndirizzo());
        dto.setCity(hospital.getComune());
        dto.setProvince(hospital.getSiglaProvincia());
        dto.setRegion(hospital.getRegione());
        dto.setYear(hospital.getAnno());
        dto.setParentStructureId(hospital.getAslId());
        dto.setParentStructureName(hospital.getAsl());
        dto.setStructureType("HOSPITAL");
        dto.setStructureTypeDescription(hospital.getTipoStruttura());
        dto.setActive(true);
        return dto;
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
            log.error("[StructureRemoteClient] QTMDB response error status={} body={}",
                    exception.getStatusCode(),
                    exception.getResponseBodyAsString(),
                    exception);
            throw new ResponseStatusException(exception.getStatusCode(), buildDownstreamMessage(exception), exception);
        } catch (RestClientException exception) {
            log.error("[StructureRemoteClient] QTMDB unavailable", exception);
            throw new ResponseStatusException(BAD_GATEWAY, SERVICE_UNAVAILABLE_MESSAGE, exception);
        }
    }

    private String buildDownstreamMessage(RestClientResponseException exception) {
        String responseBody = exception.getResponseBodyAsString();
        if (responseBody == null || responseBody.isBlank()) {
            return "Errore restituito da QTMDB durante la lettura delle ASL";
        }
        return responseBody;
    }

    @FunctionalInterface
    private interface RestCall<T> {
        T execute();
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class AslOverviewRemoteDto {
        private Long id;
        private Integer anno;
        private String codiceAzienda;
        private String denominazioneAzienda;
        private String indirizzo;
        private String email;
        private String telefono;
        private String provinciaDescrizione;
        private String regioneDescrizione;
        private Boolean imported;
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class HospitalOverviewRemoteDto {
        private Long id;
        private Integer anno;
        private String regione;
        private String asl;
        private String codiceStruttura;
        private String struttura;
        private String comune;
        private String siglaProvincia;
        private String indirizzo;
        private String tipoStruttura;
        private Long aslId;
        private Boolean imported;
    }
}
