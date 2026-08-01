package com.qtm.tenants.ticket.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TicketDto {
    private Long id;
    private String realm;
    private String project;
    private Long patientId;
    private Long therapeuticPlanId;
    private String ticketType;
}
