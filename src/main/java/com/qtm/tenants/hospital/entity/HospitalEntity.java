package com.qtm.tenants.hospital.entity;

import jakarta.persistence.*;
import com.qtm.tenants.referent.entity.ReferentEntity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity ospedale dedicata, duplicata da StructureEntity ma con tabella separata "hospitals".
 */
@Entity
@Table(name = "hospitals")
@Getter
@Setter
@NoArgsConstructor
public class HospitalEntity {

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

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "hospital_referents",
        joinColumns = @JoinColumn(name = "hospital_id"),
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

    @Column(name = "parent_hospital_id")
    private Long parentHospitalId;

    /**
     * Lista di ospedali collegati (esempio: filiali, reparti, ecc.)
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "hospital_links",
        joinColumns = @JoinColumn(name = "hospital_id"),
        inverseJoinColumns = @JoinColumn(name = "linked_hospital_id")
    )
    private java.util.List<HospitalEntity> linkedHospitals = new java.util.ArrayList<>();
}
