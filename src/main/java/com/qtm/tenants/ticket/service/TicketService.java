package com.qtm.tenants.ticket.service;

import com.qtm.tenants.ticket.client.TicketClient;
import com.qtm.tenants.ticket.dto.TicketDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service per la gestione dei ticket tramite QTMTicket.
 * Intermedia le richieste del controller verso il client QTMTicket.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketClient ticketClient;

    /**
     * Crea un nuovo ticket su QTMTicket.
     */
    public TicketDto createTicket(TicketDto ticketDto) {
        log.info("Service: creazione ticket");
        return ticketClient.createTicket(ticketDto);
    }

    /**
     * Ricerca ticket con filtri multipli.
     */
    public Object searchTickets(
            String realm,
            String project,
            String patientId,
            String status,
            Integer page,
            Integer size,
            String sort
    ) {
        log.info("Service: ricerca ticket realm={}, project={}, patientId={}, status={}", realm, project, patientId, status);
        return ticketClient.searchTickets(realm, project, patientId, status, page, size, sort);
    }

    /**
     * Recupera un ticket per ID.
     */
    public TicketDto getTicketById(Long id) {
        log.info("Service: recupero ticket ID: {}", id);
        return ticketClient.getTicketById(id);
    }

    /**
     * Aggiorna un ticket.
     */
    public TicketDto updateTicket(Long id, TicketDto ticketDto) {
        log.info("Service: aggiornamento ticket ID: {}", id);
        return ticketClient.updateTicket(id, ticketDto);
    }

    /**
     * Elimina un ticket.
     */
    public void deleteTicket(Long id) {
        log.info("Service: eliminazione ticket ID: {}", id);
        ticketClient.deleteTicket(id);
    }

    /**
     * Cambia solamente lo status del ticket.
     */
    public TicketDto changeStatus(Long id, String newStatus) {
        log.info("Service: cambio status ticket ID: {} -> {}", id, newStatus);
        return ticketClient.changeStatus(id, newStatus);
    }
}
