package com.qtm.tenants.geography.service;

import java.util.List;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.qtm.commonlib.dto.GeographicOptionDto;
import com.qtm.external.client.TicketGeographyClient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class TicketGeographyService {

    private final TicketGeographyClient ticketGeographyClient;

    @Cacheable(value = "geo_regions")
    public List<GeographicOptionDto> findRegions() {
        return ticketGeographyClient.findRegions().stream()
                .map(region -> new GeographicOptionDto(region.getId(), region.getName()))
                .toList();
    }

    @Cacheable(value = "geo_provinces", key = "#regionId")
    public List<GeographicOptionDto> findProvincesByRegionId(Long regionId) {
        return ticketGeographyClient.findProvincesByRegionId(regionId).stream()
                .map(province -> new GeographicOptionDto(province.getId(), province.getName()))
                .toList();
    }

    @Cacheable(value = "geo_cities", key = "#provinceId")
    public List<GeographicOptionDto> findCitiesByProvinceId(Long provinceId) {
        log.info("[TicketGeographyService] Loading cities for provinceId={}", provinceId);
        return ticketGeographyClient.findCitiesByProvinceId(provinceId).stream()
                .map(city -> new GeographicOptionDto(city.getId(), city.getName()))
                .toList();
    }
}