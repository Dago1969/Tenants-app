package com.qtm.tenants.therapeuticplan.mapper;

import com.qtm.tenants.doctor.entity.DoctorEntity;
import com.qtm.tenants.equipment.entity.EquipmentEntity;
import com.qtm.tenants.nurse.entity.NurseEntity;
import com.qtm.tenants.structure.entity.StructureEntity;
import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanDto;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Mapper Spring per conversione tra TherapeuticPlanEntity e TherapeuticPlanDto.
 */
@Component
public class TherapeuticPlanMapper {

    public TherapeuticPlanDto toDto(TherapeuticPlanEntity entity) {
        return toDto(entity, null);
    }

    public TherapeuticPlanDto toDto(TherapeuticPlanEntity entity, String patientDisplayName) {
        if (entity == null) {
            return null;
        }

        StructureEntity structure = entity.getStructure();
        NurseEntity nurse = entity.getNurse();
        DoctorEntity doctor = entity.getDoctor();
        List<EquipmentEntity> equipments = entity.getEquipments() == null ? List.of() : entity.getEquipments();

        return TherapeuticPlanDto.builder()
                .id(entity.getId())
                .patientId(entity.getPatientId())
                .patientDisplayName(patientDisplayName)
                .projectCode(entity.getProjectCode())
                .equipmentIds(equipments.stream()
                        .map(EquipmentEntity::getId)
                        .filter(Objects::nonNull)
                        .toList())
                .equipmentCodes(equipments.stream()
                        .map(EquipmentEntity::getCode)
                        .filter(Objects::nonNull)
                        .toList())
                .structureId(structure != null ? structure.getId() : null)
                .structureType(structure != null ? structure.getStructureType() : null)
                .structureName(structure != null ? structure.getName() : null)
                .nurseId(nurse != null ? nurse.getId() : null)
                .nurseName(nurse != null ? nurse.getFullName() : null)
                .doctorId(doctor != null ? doctor.getId() : null)
                .doctorName(doctor != null ? doctor.getFullName() : null)
                .drugCode(entity.getDrugCode())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .build();
    }

    public TherapeuticPlanEntity toNewEntity(
            TherapeuticPlanDto dto,
            StructureEntity structure,
            NurseEntity nurse,
            DoctorEntity doctor,
            List<EquipmentEntity> equipments
    ) {
        TherapeuticPlanEntity entity = new TherapeuticPlanEntity();
        updateEntity(entity, dto, structure, nurse, doctor, equipments);
        entity.setId(dto.getId());
        return entity;
    }

    public void updateEntity(
            TherapeuticPlanEntity entity,
            TherapeuticPlanDto dto,
            StructureEntity structure,
            NurseEntity nurse,
            DoctorEntity doctor,
            List<EquipmentEntity> equipments
    ) {
        entity.setPatientId(dto.getPatientId());
        entity.setProjectCode(dto.getProjectCode());
        entity.setEquipments(new ArrayList<>(equipments));
        entity.setStructure(structure);
        entity.setNurse(nurse);
        entity.setDoctor(doctor);
        entity.setDrugCode(dto.getDrugCode());
        entity.setStartDate(dto.getStartDate());
        entity.setEndDate(dto.getEndDate());
        entity.setStatus(dto.getStatus());
        entity.setNotes(dto.getNotes());
    }
}