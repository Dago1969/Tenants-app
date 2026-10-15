package com.qtm.tenants.therapeuticplan.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private Boolean consentRevoked;
    private String projectCode;
    private List<Long> equipmentIds;
    private List<String> equipmentCodes;
    @JsonProperty("hospitalId")
    @JsonAlias("structureId")
    private Long structureId;
    private String structureType;
    private String structureName;
    private Long departmentId;
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
    private String drugDescription;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate dischargeDate;
    private String dischargeType;
    private String status;
    private String notes;
    /**
     * Template JSON della visita risolto dal progetto associato al piano terapeutico.
     */
    private String jsonVisit;

    /** Definizione JSON del questionario di accettazione configurato sul progetto. */
    private String jsonSurvey;

    private String surveyAnswers;
    private LocalDateTime surveyAcceptedAt;
    private String surveyAcceptanceToken;
    private String surveyAcceptanceRecipient;
}