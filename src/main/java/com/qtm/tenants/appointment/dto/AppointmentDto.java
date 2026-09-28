package com.qtm.tenants.appointment.dto;

import com.qtm.tenants.appointment.entity.RecurrenceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO per l'appuntamento nel piano terapeutico.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class AppointmentDto {
    private Long id;
    private Long therapeuticPlanId;
    private String therapeuticPlanPatientDisplayName;
    private Long appointmentTypeId;
    private String appointmentTypeName;
    private Integer appointmentTypeDurationMinutes;
    private Long nurseId;
    private String nurseName;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private RecurrenceType recurrenceType;
    private LocalDate recurrenceEndDate;
    private Boolean reminderEnabled;
    private Integer reminderMinutesBefore;
    private String status;
    private String notes;
    private String appointmentCategory;
    private String patientFirstName;
    private String patientLastName;
    private String patientFiscalCode;
    private String patientPhone;
    private String caregiverPhone;
    private String patientAddress;
    private String address;
    private String city;
    private String facility;
    private String patientCode;
    private String patientName;
    private String dischargeType;
    private LocalDate dischargeDate;
    private String prevalentDoctorCode;
    private String prevalentDoctorName;
}
