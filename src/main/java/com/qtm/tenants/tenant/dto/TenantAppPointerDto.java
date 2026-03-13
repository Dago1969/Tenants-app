package com.qtm.tenants.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO usato da TENANTS-APP per leggere il puntamento tenant esposto da QTMDashboard.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantAppPointerDto {

    private Long id;
    private String clientCode;
    private String clientName;
    private String tenantAppUrl;
    private boolean enabled;
}