package com.qtm.tenants.medicine.controller;

import com.qtm.commonlib.dto.MedicineDto;
import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.medicine.service.DashboardMedicineClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller proxy del catalogo farmaci QTMDB per i flussi del piano terapeutico su TENAPP.
 */
@RestController
@RequestMapping("/api/tenants/medicines")
@RequiredArgsConstructor
public class MedicineProxyController {

    private static final String MODULE_CODE = "THERAPEUTIC_PLAN";

    private final DashboardMedicineClient dashboardMedicineClient;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @GetMapping("/lookup")
    public List<MedicineDto> lookup(
            @RequestParam(required = false) String query,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return dashboardMedicineClient.lookup(query);
    }

    @GetMapping("/codice-aic/{codiceAic}")
    public MedicineDto findByCodiceAic(
            @PathVariable String codiceAic,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return dashboardMedicineClient.findByCodiceAic(codiceAic);
    }
}