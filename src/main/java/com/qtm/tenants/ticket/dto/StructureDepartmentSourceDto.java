package com.qtm.tenants.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StructureDepartmentSourceDto {
    private Long id;
    private String codiceStruttura;
    private String codiceDisciplina;
    private String disciplina;
    private String indirizzo;
}
