package com.qtm.tenants.structure.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Stub DTO per rappresentare un dipartimento ospedaliero.
 * Creato per risolvere riferimenti temporanei durante la compilazione.
 */
@Getter
@Setter
@NoArgsConstructor
public class HospitalDepartmentDto {
    private Long id;
    private String code;
    private String name;
    private Long referentId;
    private Long departmentId;
}
