package com.qtm.tenants.structure.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO di decoding del tipo struttura con informazioni gerarchiche e funzionali.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StructureTypeDto {

    private String code;
    private String description;
    private String functionDescription;
    private String parentTypeCode;
    private String parentTypeDescription;
}
