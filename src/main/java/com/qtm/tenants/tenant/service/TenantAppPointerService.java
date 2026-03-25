package com.qtm.tenants.tenant.service;

import com.qtm.tenants.tenant.dto.TenantAppPointerDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service di orchestrazione per recuperare i tenant pointer remoti da QTMDashboard.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TenantAppPointerService {

    private final DashboardTenantPointerClient dashboardTenantPointerClient;

    @Transactional(readOnly = true)
    public TenantAppPointerDto findByClientCode(String clientCode) {
        log.info("[TenantAppPointerService] Loading tenant pointer for clientCode={}", clientCode);
        return dashboardTenantPointerClient.findByClientCode(clientCode);
    }
}