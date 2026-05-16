package com.qtm.tenants.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO per il tipo di appuntamento con durata oraria.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentTypeDto {
    private Long id;
    private String name;
    private String description;
    /**
     * Durata in minuti.
     */
    private Integer durationMinutes;
}
