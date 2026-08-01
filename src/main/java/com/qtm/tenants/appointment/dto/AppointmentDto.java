package com.qtm.tenants.appointment.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AppointmentDto {
    private Long id;
    private String therapeuticPlanPatientDisplayName;
    private String appointmentTypeName;
    private Integer appointmentTypeDurationMinutes;
    private String nurseName;
}
