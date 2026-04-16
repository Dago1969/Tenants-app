package com.qtm.tenants.equipment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO per la rappresentazione di una attrezzatura fisica associata a un tipo attrezzatura.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentDTO {
    private Long id;
    private Long equipmentTypeId;
    private String equipmentTypeCode;
    private String equipmentTypeName;
    private String code;
    private String status;
    private String serialNumber;
    private String location;
    private String assignedTo;
    private LocalDate purchaseDate;
    private LocalDate lastRevisionDate;
    private LocalDate nextRevisionDate;
    private String notes;
    private String primaryJson;
    private String secondaryJson;
}