package com.qtm.tenants.structure.entity;

import jakarta.persistence.*;
import com.qtm.tenants.referent.entity.ReferentEntity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity struttura tenant generalizzata per ASL, ospedali, farmacie, magazzini e altri nodi organizzativi.
 */
@Entity
@Table(name = "structures")
@Getter
@Setter
@NoArgsConstructor
public class StructureEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", unique = true)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;


    @Column(name = "address", nullable = false)
    private String address;

    @Column(name = "cap")
    private String cap;


    /**
     * Lista di referenti associati alla struttura.
     */
    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "structure_referents",
        joinColumns = @JoinColumn(name = "structure_id"),
        inverseJoinColumns = @JoinColumn(name = "referent_id")
    )
    private java.util.List<ReferentEntity> referents = new java.util.ArrayList<>();

    @Column(name = "city_id")
    private Long cityId;

    @Column(name = "city")
    private String city;

    @Column(name = "province_id")
    private Long provinceId;

    @Column(name = "province")
    private String province;

    @Column(name = "region_id")
    private Long regionId;

    @Column(name = "region")
    private String region;

    @Column(name = "phone")
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "active")
    private Boolean active = true;

    @Column(name = "structure_type")
    private String structureType;

    @Column(name = "parent_structure_id")
    private Long parentStructureId;

    /**
     * Lista di farmacie collegate (altre strutture di tipo farmacia)
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "structure_pharmacies",
        joinColumns = @JoinColumn(name = "structure_id"),
        inverseJoinColumns = @JoinColumn(name = "pharmacy_id")
    )
    private java.util.List<StructureEntity> pharmacies = new java.util.ArrayList<>();
}
