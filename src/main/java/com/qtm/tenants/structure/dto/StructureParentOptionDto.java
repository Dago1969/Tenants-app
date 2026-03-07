package com.qtm.tenants.structure.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO opzione parent per le strutture gerarchiche.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StructureParentOptionDto {

    private Long id;
    private String code;
    private String name;
    private String structureType;
    private String structureTypeDescription;
}
