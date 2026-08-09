package com.qtm.tenants.structure.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.qtm.tenants.referent.entity.ReferentEntity;
import com.qtm.tenants.structure.entity.StructureEntity;

@Entity
@Table(name = "hospital_department_entity")
@Getter
@Setter
@NoArgsConstructor
public class HospitalDepartmentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "department_id", nullable = false)
    private Long departmentId;

    @ManyToOne
    @JoinColumn(name = "referent_id")
    private ReferentEntity referent;

    @ManyToOne
    @JoinColumn(name = "structure_id", nullable = false)
    private StructureEntity structure;
}
