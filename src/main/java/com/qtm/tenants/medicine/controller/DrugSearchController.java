package com.qtm.tenants.medicine.controller;

import com.qtm.commonlib.dto.FarmacoDto;
import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.medicine.service.TicketDrugClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Facade TENAPP per la ricerca dei farmaci condivisi dal microservizio TICKET.
 */
@RestController
@RequestMapping("/api/tenants/v1/drugs")
@RequiredArgsConstructor
public class DrugSearchController {

    private static final String MODULE_CODE = "THERAPEUTIC_PLAN";

    private final TicketDrugClient ticketDrugClient;
    private final ControllerFunctionAuthorizationService authorizationService;

    @GetMapping("/search")
    public List<FarmacoDto> search(
            @RequestParam String query,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        authorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ticketDrugClient.search(query);
    }
}