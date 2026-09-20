package com.qtm.tenants.structure.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Riga lookup aggregata per la cascata Regione -> ASL -> Struttura esposta verso il frontend TENAPP.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StructureOverviewDto {

    private Long aslId;
    private Long strutturaId;
    private String codiceRegione;
    private String regione;
    private String codiceAsl;
    private String asl;
    private String codiceStruttura;
    private String struttura;
}