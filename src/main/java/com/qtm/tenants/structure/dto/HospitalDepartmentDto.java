package com.qtm.tenants.structure.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO per l'associazione tra struttura ospedaliera, dipartimento Ticket e referente locale.
 */
@Getter
@Setter
@NoArgsConstructor
public class HospitalDepartmentDto {

    private Long departmentId;
    private Long referentId;
}
