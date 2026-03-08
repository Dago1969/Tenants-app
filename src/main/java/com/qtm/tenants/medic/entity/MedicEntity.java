package com.qtm.tenants.medic.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entity medico tenant con dati identificativi, di contatto e consensi privacy.
 */
@Entity
@Table(name = "medics")
@Getter
@Setter
@NoArgsConstructor
public class MedicEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doctor_flyer_id", unique = true)
    private String doctorFlyerId;

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

    @Column(name = "delivery_address")
    private String deliveryAddress;

    @Column(name = "secondary_addresses", length = 2000)
    private String secondaryAddresses;

    @Column(name = "structure_id")
    private Long structureId;

    @Column(name = "specialization")
    private String specialization;

    @Column(name = "data_processing_consent")
    private Boolean dataProcessingConsent;

    @Column(name = "data_processing_consent_datetime")
    private LocalDateTime dataProcessingConsentDateTime;

    @Column(name = "data_processing_consent_revocation_log", length = 4000)
    private String dataProcessingConsentRevocationLog;

    @Column(name = "additional_consents", length = 2000)
    private String additionalConsents;
}
