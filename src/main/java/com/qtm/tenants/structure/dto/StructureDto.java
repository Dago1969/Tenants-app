package com.qtm.tenants.structure.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO struttura tenant con parametri decodificati per tipo e parent.
 */
@Getter
@Setter
@NoArgsConstructor
public class StructureDto {

    private Long id;
    private String code;
    private String name;
    private String description;
    private String address;
    private String city;
    private String province;
    private String region;
    private String phone;
    private String email;
    private boolean active;
    private String structureType;
    private String structureTypeDescription;
    private String functionDescription;
    private Long parentStructureId;
    private String parentStructureName;
}
