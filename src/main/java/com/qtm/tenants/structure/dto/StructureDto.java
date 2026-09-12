package com.qtm.tenants.structure.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.qtm.tenants.referent.dto.ReferentDto;

import java.util.List;

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
    private String selectionLabel;
    private String description;
    private String address;
    private String cap;
    private Long cityId;
    private String city;
    private Long provinceId;
    private String province;
    private Long regionId;
    private String region;
    private Integer year;
    private String phone;
    private String email;
    private String serviceCalendarHours;
    private boolean active;
    private String structureType;
    private String structureTypeDescription;
    private String functionDescription;
    private Integer structureTypeDisplayOrder;
    private Long parentStructureId;
    private String parentStructureName;

    /**
     * Lista di referenti associati alla struttura.
     */
    private java.util.List<ReferentDto> referents;

    /** External source identification (e.g. 'QTMTicket') */
    private String externalSource;

    /** External id in the external source (e.g. ASL/Hospital id from QTMTicket) */
    private Long externalId;

    /** Optional JSON snapshot of referents stored for quick lookup */
    private String referentsJson;

    /**
     * Dipartimenti Ticket associati alla struttura ospedaliera con referente locale opzionale.
     */
    private List<HospitalDepartmentDto> departmentsSelected;
}
