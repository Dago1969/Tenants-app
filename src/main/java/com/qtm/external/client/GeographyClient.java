package com.qtm.external.client;

import com.qtm.commonlib.dto.CityDto;
import com.qtm.commonlib.dto.ProvinceDto;
import com.qtm.commonlib.dto.RegionDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

/** Client REST per leggere il catalogo geografico dal servizio dedicato. */
@Component
public class GeographyClient {

    private static final ParameterizedTypeReference<List<RegionDto>> REGION_LIST_TYPE = new ParameterizedTypeReference<>() { };
    private static final ParameterizedTypeReference<List<ProvinceDto>> PROVINCE_LIST_TYPE = new ParameterizedTypeReference<>() { };
    private static final ParameterizedTypeReference<List<CityDto>> CITY_LIST_TYPE = new ParameterizedTypeReference<>() { };

    private final RestClient restClient;

    public GeographyClient(
            RestClient.Builder restClientBuilder,
            @Value("${services.qtm-geography-service.url}") String geographyServiceUrl
    ) {
        this.restClient = restClientBuilder.baseUrl(geographyServiceUrl).build();
    }

    public List<RegionDto> findRegions() {
        return restClient.get()
                .uri("/regions")
                .headers(RequestContextHeaderForwarder::forward)
                .retrieve()
                .body(REGION_LIST_TYPE);
    }

    public List<ProvinceDto> findProvincesByRegionId(Long regionId) {
        return restClient.get()
                .uri("/provinces/by-region/{regionId}", regionId)
                .headers(RequestContextHeaderForwarder::forward)
                .retrieve()
                .body(PROVINCE_LIST_TYPE);
    }

    public List<CityDto> findCitiesByProvinceId(Long provinceId) {
        return restClient.get()
                .uri("/cities/by-province/{provinceId}", provinceId)
                .headers(RequestContextHeaderForwarder::forward)
                .retrieve()
                .body(CITY_LIST_TYPE);
    }
}