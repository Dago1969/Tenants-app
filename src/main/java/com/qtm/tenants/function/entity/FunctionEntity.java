package com.qtm.tenants.function.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity funzione applicativa tenant.
 */
@Entity
@Table(name = "functions")
@Getter
@Setter
@NoArgsConstructor
public class FunctionEntity {

    @Id
    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;
}
