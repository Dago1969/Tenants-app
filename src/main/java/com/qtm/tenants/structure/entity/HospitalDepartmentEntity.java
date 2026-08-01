package com.qtm.tenants.structure.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

import com.qtm.tenants.referent.entity.ReferentEntity;
import com.qtm.tenants.structure.entity.StructureEntity;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class HospitalDepartmentEntity {
    @Id
    private Long id;
    private Long departmentId;
    @ManyToOne
    private ReferentEntity referent;
    @ManyToOne
    private StructureEntity structure;
}
