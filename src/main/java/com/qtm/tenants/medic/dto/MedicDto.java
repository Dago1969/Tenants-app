package com.qtm.tenants.medic.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * DTO medico tenant.
 */
@Getter
@Setter
@NoArgsConstructor
public class MedicDto {

    private Long id;
    private String doctorFlyerId;
    private String fullName;
    private String email;
    private String primaryPhone;
    private String secondaryPhone;
    private Long regionId;
    private String region;
    private Long provinceId;
    private String province;
    private Long cityId;
    private String city;
    private String deliveryAddress;
    private String secondaryAddresses;
    private Long structureId;
    private String specialization;
    private Boolean dataProcessingConsent;
    private LocalDateTime dataProcessingConsentDateTime;
    private String dataProcessingConsentRevocationLog;
    private String additionalConsents;
}
