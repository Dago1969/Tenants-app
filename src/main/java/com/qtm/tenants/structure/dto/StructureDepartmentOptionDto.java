package com.qtm.tenants.structure.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Opzione pronta per la select dei dipartimenti associabili a una struttura.
 */
@Getter
@AllArgsConstructor
public class StructureDepartmentOptionDto {

    private final Long id;
    private final String label;
}