package com.qtm.tenants.geography.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO di lettura allineato alla risposta regioni di QTMDashboard.
 */
@Getter
@Setter
@NoArgsConstructor
public class DashboardRegionDto {

    private Long id;
    private String name;
}