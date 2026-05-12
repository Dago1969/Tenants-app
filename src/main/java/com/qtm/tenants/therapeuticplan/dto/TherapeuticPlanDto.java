package com.qtm.tenants.therapeuticplan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO del piano terapeutico con riferimenti alle entita cliniche e alle attrezzature collegate.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TherapeuticPlanDto {
    private Long id;
    private Long patientId;
    private String patientDisplayName;
    private String projectCode;
    private List<Long> equipmentIds;
    private List<String> equipmentCodes;
    private Long structureId;
    private String structureType;
    private String structureName;
    private List<Long> nurseIds;
    private List<String> nurseNames;
    private List<TherapeuticPlanProfessionalAssignmentDto> nurseAssignments;
    private Long prevalentNurseId;
    private String prevalentNurseName;
    private Long nurseId;
    private String nurseName;
    private List<Long> doctorIds;
    private List<String> doctorNames;
    private List<TherapeuticPlanProfessionalAssignmentDto> doctorAssignments;
    private Long prevalentDoctorId;
    private String prevalentDoctorName;
    private Long doctorId;
    private String doctorName;
    private String drugCode;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String notes;
    /**
     * Template JSON della visita risolto dal progetto associato al piano terapeutico.
     */
    private String jsonVisit;
}