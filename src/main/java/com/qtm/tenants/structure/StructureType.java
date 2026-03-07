package com.qtm.tenants.structure;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Definizione runtime del tipo struttura caricata dal catalogo persistito a database.
 */
@Getter
@RequiredArgsConstructor
public class StructureType {

    private final String code;
    private final String description;
    private final String functionDescription;
    private final String parentTypeCode;
    private final String parentTypeDescription;
}
