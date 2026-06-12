package com.qtm.tenants.ticket.controller;

import com.qtm.tenants.ticket.dto.TicketDto;
import com.qtm.tenants.ticket.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller REST per la gestione dei ticket.
 * - POST /tickets: Creazione consentita a tutti gli autenticati
 * - GET/PUT/DELETE: Consentiti solo a SUPERADMIN e OperatoreQTM
 */
@Slf4j
@RestController
@RequestMapping("/api/tenants/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    /**
     * POST /tickets - Crea un nuovo ticket (consentito a tutti gli autenticati)
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketDto> createTicket(@RequestBody TicketDto ticketDto) {
        log.info("Richiesta creazione ticket");
        TicketDto created = ticketService.createTicket(ticketDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * GET /tickets/search - Ricerca ticket con filtri multipli.
     * Restituisce il payload paginato proveniente da QTMTicket.
     */
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Object> searchTickets(
            @RequestParam(required = false) String realm,
            @RequestParam(required = false) String project,
            @RequestParam(required = false) String patientId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort
    ) {
        log.info("Richiesta ricerca ticket: realm={}, project={}, patientId={}, status={}", realm, project, patientId, status);
        Object searchResult = ticketService.searchTickets(realm, project, patientId, status, page, size, sort);
        return ResponseEntity.ok(searchResult);
    }

    /**
     * GET /tickets/{id} - Recupera un ticket per ID (solo SUPERADMIN/OperatoreQTM)
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN') or hasRole('OPERATOREQTM')")
    public ResponseEntity<TicketDto> getTicket(@PathVariable Long id) {
        log.info("Richiesta recupero ticket ID: {}", id);
        TicketDto ticket = ticketService.getTicketById(id);
        return ResponseEntity.ok(ticket);
    }

    /**
     * PUT /tickets/{id} - Aggiorna un ticket (solo SUPERADMIN/OperatoreQTM)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN') or hasRole('OPERATOREQTM')")
    public ResponseEntity<TicketDto> updateTicket(@PathVariable Long id, @RequestBody TicketDto ticketDto) {
        log.info("Richiesta aggiornamento ticket ID: {}", id);
        TicketDto updated = ticketService.updateTicket(id, ticketDto);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /tickets/{id} - Elimina un ticket (solo SUPERADMIN/OperatoreQTM)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN') or hasRole('OPERATOREQTM')")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
        log.info("Richiesta eliminazione ticket ID: {}", id);
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /tickets/{id}/status/{newStatus} - Cambia lo status del ticket (consentito a tutti gli autenticati)
     */
    @PatchMapping("/{id}/status/{newStatus}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketDto> changeStatus(@PathVariable Long id, @PathVariable String newStatus) {
        log.info("Richiesta cambio status ticket ID: {} -> {}", id, newStatus);
        TicketDto updated = ticketService.changeStatus(id, newStatus);
        return ResponseEntity.ok(updated);
    }
}
