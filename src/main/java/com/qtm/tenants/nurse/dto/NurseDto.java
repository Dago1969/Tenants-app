package com.qtm.tenants.nurse.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO infermiere tenant.
 */
@Getter
@Setter
@NoArgsConstructor
public class NurseDto {

    private Long id;
    private String nurseProjectId;
    private String fullName;
    private String email;
    private String primaryPhone;
    private String secondaryPhone;
    private String region;
    private String province;
    private String coverageArea;
    private String referenceProvider;
    private String professionalRegister;
    private Boolean enabled;
}
