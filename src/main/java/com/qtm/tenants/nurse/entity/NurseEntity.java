package com.qtm.tenants.nurse.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity infermiere tenant con dati identificativi e di contatto.
 */
@Entity
@Table(name = "nurses")
@Getter
@Setter
@NoArgsConstructor
public class NurseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nurse_project_id", unique = true)
    private String nurseProjectId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "email")
    private String email;

    @Column(name = "primary_phone")
    private String primaryPhone;

    @Column(name = "secondary_phone")
    private String secondaryPhone;

    @Column(name = "region_id")
    private Long regionId;

    @Column(name = "region")
    private String region;

    @Column(name = "province_id")
    private Long provinceId;

    @Column(name = "province")
    private String province;

    @Column(name = "city_id")
    private Long cityId;

    @Column(name = "city")
    private String city;

    @Column(name = "coverage_area")
    private String coverageArea;

    @Column(name = "reference_provider")
    private String referenceProvider;

    @Column(name = "professional_register")
    private String professionalRegister;

    @Column(name = "enabled")
    private Boolean enabled;
}
