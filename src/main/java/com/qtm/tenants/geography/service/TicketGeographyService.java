package com.qtm.tenants.geography.service;

import java.util.List;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.qtm.commonlib.dto.GeographicOptionDto;
import com.qtm.external.client.GeographyClient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class TicketGeographyService {

    private final GeographyClient geographyClient;

    @Cacheable(value = "geo_regions")
    public List<GeographicOptionDto> findRegions() {
        return geographyClient.findRegions().stream()
                .map(region -> new GeographicOptionDto(region.getId(), region.getName()))
                .toList();
    }

    public List<GeographicOptionDto> findProvincesByRegionId(Long regionId) {
        return geographyClient.findProvincesByRegionId(regionId).stream()
                .map(province -> new GeographicOptionDto(province.getId(), province.getName()))
                .toList();
    }

    public List<GeographicOptionDto> findCitiesByProvinceId(Long provinceId) {
        log.info("[TicketGeographyService] Loading cities for provinceId={}", provinceId);
        return geographyClient.findCitiesByProvinceId(provinceId).stream()
                .map(city -> new GeographicOptionDto(city.getId(), city.getName()))
                .toList();
    }
}