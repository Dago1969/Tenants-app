package com.qtm.tenants.module.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity modulo applicativo tenant.
 */
@Entity
@Table(name = "modules")
@Getter
@Setter
@NoArgsConstructor
public class ModuleEntity {

    @Id
    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;
}
