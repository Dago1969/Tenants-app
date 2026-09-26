package com.qtm.external.client;

import com.qtm.commonlib.dto.TicketCityDto;
import com.qtm.commonlib.dto.TicketProvinceDto;
import com.qtm.commonlib.dto.TicketRegionDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "ticket-geography-client", url = "${qtm.ticket.base-url}")
public interface TicketGeographyClient {

    @GetMapping("/api/regions")
    List<TicketRegionDto> findRegions();

    @GetMapping("/api/provinces/by-region/{regionId}")
    List<TicketProvinceDto> findProvincesByRegionId(@PathVariable("regionId") Long regionId);

    @GetMapping("/api/cities/by-province/{provinceId}")
    List<TicketCityDto> findCitiesByProvinceId(@PathVariable("provinceId") Long provinceId);
}