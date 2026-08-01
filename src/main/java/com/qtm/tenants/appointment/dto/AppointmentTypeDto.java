package com.qtm.tenants.appointment.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AppointmentTypeDto {
    private Long id;
    private String name;
    private Integer durationMinutes;
}
