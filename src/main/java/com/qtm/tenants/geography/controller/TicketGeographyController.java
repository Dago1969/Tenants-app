package com.qtm.tenants.geography.controller;

import com.qtm.commonlib.dto.GeographicOptionDto;
import com.qtm.external.client.HospitalClient;
import com.qtm.external.client.TicketGeographyClient;
import com.qtm.tenants.geography.service.TicketGeographyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller REST che espone a TENANTS-APP le anagrafiche geografiche fornite da QTMTicket.
 */
@RestController
@RequestMapping("/api/tenants/geography")
@RequiredArgsConstructor
@Slf4j
public class TicketGeographyController {

	private final TicketGeographyService ticketGeographyService;

    @GetMapping("/regions")
    public List<GeographicOptionDto> findRegions() {
        log.info("[TicketGeographyController] Chiamata a /api/tenants/geography/regions");
        List<GeographicOptionDto> result = ticketGeographyService.findRegions();
        log.info("[TicketGeographyController] Restituite {} regioni", result != null ? result.size() : 0);
        return result;
    }

    @GetMapping("/provinces/by-region/{regionId}")
    public List<GeographicOptionDto> findProvincesByRegionId(@PathVariable Long regionId) {
        return ticketGeographyService.findProvincesByRegionId(regionId);
    }

    @GetMapping("/cities/by-province/{provinceId}")
    public List<GeographicOptionDto> findCitiesByProvinceId(@PathVariable Long provinceId) {
        return ticketGeographyService.findCitiesByProvinceId(provinceId);
    }
}
