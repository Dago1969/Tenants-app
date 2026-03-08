package com.qtm.tenants.geography.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO di lettura allineato alla risposta province di QTMDashboard.
 */
@Getter
@Setter
@NoArgsConstructor
public class DashboardProvinceDto {

    private Long id;
    private String name;
    private Long regionId;
}