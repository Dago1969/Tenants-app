package com.qtm.tenants.patient.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * DTO paziente tenant.
 */
@Getter
@Setter
@NoArgsConstructor
public class PatientDto {

    private Long id;
    private String assistedId;
    private String firstName;
    private String lastName;
    private String fiscalCode;
    private String email;
    private String primaryPhone;
    private String secondaryPhone;
    private String region;
    private String province;
    private String deliveryAddress;
    private String secondaryAddresses;
    private String communicationChannels;
    private String identificationDocumentReference;
    private Boolean dataProcessingConsent;
    private LocalDateTime dataProcessingConsentDateTime;
    private String dataProcessingConsentRevocationLog;
    private String additionalConsents;
    private String therapyStatus;
    private String prescribingSpecialist;
    private String referenceHospitalStructure;
    private String referencePharmacy;
    private String preferredPickupPharmacy;
    private String deliveryMode;
    private Boolean reminderEnabled;
    private String caregiverFullName;
    private String caregiverPhone;
    private String preferredContact;
    private Long structureId;
}
