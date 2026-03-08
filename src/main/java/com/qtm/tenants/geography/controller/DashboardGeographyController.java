package com.qtm.tenants.geography.controller;

import com.qtm.tenants.geography.dto.GeographicOptionDto;
import com.qtm.tenants.geography.service.DashboardGeographyService;
import lombok.RequiredArgsConstructor;
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
public class DashboardGeographyController {

    private final DashboardGeographyService dashboardGeographyService;

    @GetMapping("/regions")
    public List<GeographicOptionDto> findRegions() {
        return dashboardGeographyService.findRegions();
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