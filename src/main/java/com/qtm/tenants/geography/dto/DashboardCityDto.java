package com.qtm.tenants.geography.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO di lettura allineato alla risposta comuni di QTMDashboard.
 */
@Getter
@Setter
@NoArgsConstructor
public class DashboardCityDto {

    private Long id;
    private String name;
    private Long provinceId;
}