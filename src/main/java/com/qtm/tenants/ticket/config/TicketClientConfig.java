package com.qtm.tenants.ticket.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Configurazione bean per TicketClient.
 */
@Configuration
public class TicketClientConfig {

    /**
     * Bean RestClient per communicare con servizi remoti.
     */
    @Bean
    public RestClient restClient() {
        return RestClient.create();
    }
}
