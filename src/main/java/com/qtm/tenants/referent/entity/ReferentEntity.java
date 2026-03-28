package com.qtm.tenants.referent.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity per il contatto referente di una struttura.
 * Contiene i dati anagrafici e di contatto del referente.
 */
@Entity
@Table(name = "referents")
@Getter
@Setter
@NoArgsConstructor
public class ReferentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "role")
    private String role;

    @Column(name = "phone")
    private String phone;

    @Column(name = "email")
    private String email;
}
