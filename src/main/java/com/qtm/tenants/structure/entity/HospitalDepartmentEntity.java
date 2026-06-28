package com.qtm.tenants.structure.entity;

import com.qtm.tenants.referent.entity.ReferentEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity di persistenza per i dipartimenti associati a una struttura ospedaliera.
 */
@Entity
@Table(name = "hospital_departments")
@Getter
@Setter
@NoArgsConstructor
public class HospitalDepartmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "structure_id", nullable = false)
    private StructureEntity structure;

    @Column(name = "department_id", nullable = false)
    private Long departmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referent_id")
    private ReferentEntity referent;
}
