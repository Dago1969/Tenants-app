package com.qtm.tenants.ticket.controller;

import com.qtm.commonlib.dto.DepartmentDto;
import com.qtm.tenants.ticket.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Proxy REST verso QTMTicket per l'elenco dipartimenti usato dal wizard ospedaliero.
 */
@Slf4j
@RestController
@RequestMapping("/api/tenants/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final TicketService ticketService;

    /**
     * GET /departments - Restituisce i dipartimenti, opzionalmente filtrati per area funzionale.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<DepartmentDto>> listDepartments(@RequestParam(required = false) String area) {
        log.info("Richiesta elenco dipartimenti area={}", area);
        return ResponseEntity.ok(ticketService.listDepartments(area));
    }
}
