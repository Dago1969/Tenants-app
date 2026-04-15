package com.qtm.tenants.equipment.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO per la rappresentazione di un tipo di equipaggiamento.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentTypeDTO {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String use;
    private BigDecimal cost;
    private String supplier;
    private boolean serialNumberRequired;
    private boolean principalJsonPresent;
    private String principalJsonPath;
    private boolean secondaryJsonPresent;
    private String secondaryJsonPath;
    private LocalDate purchaseDate;
    private String status;
}
