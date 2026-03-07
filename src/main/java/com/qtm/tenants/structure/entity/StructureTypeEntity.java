package com.qtm.tenants.structure.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Catalogo persistito dei tipi struttura disponibili nell'applicazione.
 */
@Entity
@Table(name = "structure_types")
@Getter
@Setter
@NoArgsConstructor
public class StructureTypeEntity {

    @Id
    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "function_description", nullable = false, length = 1000)
    private String functionDescription;

    @Column(name = "parent_type_code")
    private String parentTypeCode;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;
}