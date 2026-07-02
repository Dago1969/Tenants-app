package com.qtm.tenants.structure.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class HospitalOverviewDto {
    private Long id;
    private String codiceRegione;
    private String codiceAsl;
    private String codiceStruttura;
    private String struttura;
    private String indirizzo;
    private Long hospitalTypeId;
    private Long aslId;
    private Boolean imported;
    private String note;
}
