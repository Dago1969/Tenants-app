
package com.qtm.tenants.geography.controller;

import com.qtm.tenants.geography.dto.GeographicOptionDto;
import com.qtm.tenants.geography.service.DashboardGeographyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller REST che espone a TENANTS-APP le anagrafiche geografiche di QTMDashboard.
 */
@RestController
@RequestMapping("/api/tenants/geography")
@RequiredArgsConstructor

@Slf4j
public class DashboardGeographyController {

    private final DashboardGeographyService dashboardGeographyService;

    @GetMapping("/regions")
    public List<GeographicOptionDto> findRegions() {
        log.info("[DashboardGeographyController] Chiamata a /api/tenants/geography/regions");
        List<GeographicOptionDto> result = dashboardGeographyService.findRegions();
        log.info("[DashboardGeographyController] Restituite {} regioni", result != null ? result.size() : 0);
        return result;
    }

    @GetMapping("/provinces/by-region/{regionId}")
    public List<GeographicOptionDto> findProvincesByRegionId(@PathVariable Long regionId) {
        return dashboardGeographyService.findProvincesByRegionId(regionId);
    }

    @GetMapping("/cities/by-province/{provinceId}")
    public List<GeographicOptionDto> findCitiesByProvinceId(@PathVariable Long provinceId) {
        return dashboardGeographyService.findCitiesByProvinceId(provinceId);
    }
}