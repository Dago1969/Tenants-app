package com.qtm.tenants.therapeuticplan.mapper;

import com.qtm.tenants.equipment.entity.EquipmentEntity;
import com.qtm.tenants.structure.entity.StructureEntity;
import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanProfessionalAssignmentDto;
import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanDto;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanDoctorAssignmentEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanNurseAssignmentEntity;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

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
        List<EquipmentEntity> equipments = entity.getEquipments() == null ? List.of() : entity.getEquipments();
        List<TherapeuticPlanNurseAssignmentEntity> nurseAssignments = entity.getNurseAssignments() == null ? List.of() : entity.getNurseAssignments();
        List<TherapeuticPlanDoctorAssignmentEntity> doctorAssignments = entity.getDoctorAssignments() == null ? List.of() : entity.getDoctorAssignments();
        TherapeuticPlanNurseAssignmentEntity prevalentNurseAssignment = nurseAssignments.isEmpty() ? null : nurseAssignments.get(0);
        TherapeuticPlanDoctorAssignmentEntity prevalentDoctorAssignment = doctorAssignments.isEmpty() ? null : doctorAssignments.get(0);

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
                        .nurseIds(nurseAssignments.stream()
                            .map(TherapeuticPlanNurseAssignmentEntity::getNurse)
                            .filter(Objects::nonNull)
                            .map(currentNurse -> currentNurse.getId())
                            .filter(Objects::nonNull)
                            .toList())
                        .nurseNames(nurseAssignments.stream()
                            .map(TherapeuticPlanNurseAssignmentEntity::getNurse)
                            .filter(Objects::nonNull)
                            .map(currentNurse -> currentNurse.getFullName())
                            .filter(Objects::nonNull)
                            .toList())
                        .nurseAssignments(nurseAssignments.stream()
                            .map(assignment -> TherapeuticPlanProfessionalAssignmentDto.builder()
                                .professionalId(assignment.getNurse() != null ? assignment.getNurse().getId() : null)
                                .professionalName(assignment.getNurse() != null ? assignment.getNurse().getFullName() : null)
                                .priorityIndex(assignment.getPriorityIndex())
                                .build())
                            .toList())
                        .prevalentNurseId(prevalentNurseAssignment != null && prevalentNurseAssignment.getNurse() != null ? prevalentNurseAssignment.getNurse().getId() : null)
                        .prevalentNurseName(prevalentNurseAssignment != null && prevalentNurseAssignment.getNurse() != null ? prevalentNurseAssignment.getNurse().getFullName() : null)
                        .nurseId(prevalentNurseAssignment != null && prevalentNurseAssignment.getNurse() != null ? prevalentNurseAssignment.getNurse().getId() : null)
                        .nurseName(prevalentNurseAssignment != null && prevalentNurseAssignment.getNurse() != null ? prevalentNurseAssignment.getNurse().getFullName() : null)
                        .doctorIds(doctorAssignments.stream()
                            .map(TherapeuticPlanDoctorAssignmentEntity::getDoctor)
                            .filter(Objects::nonNull)
                            .map(currentDoctor -> currentDoctor.getId())
                            .filter(Objects::nonNull)
                            .toList())
                        .doctorNames(doctorAssignments.stream()
                            .map(TherapeuticPlanDoctorAssignmentEntity::getDoctor)
                            .filter(Objects::nonNull)
                            .map(currentDoctor -> currentDoctor.getFullName())
                            .filter(Objects::nonNull)
                            .toList())
                        .doctorAssignments(doctorAssignments.stream()
                            .map(assignment -> TherapeuticPlanProfessionalAssignmentDto.builder()
                                .professionalId(assignment.getDoctor() != null ? assignment.getDoctor().getId() : null)
                                .professionalName(assignment.getDoctor() != null ? assignment.getDoctor().getFullName() : null)
                                .priorityIndex(assignment.getPriorityIndex())
                                .build())
                            .toList())
                        .prevalentDoctorId(prevalentDoctorAssignment != null && prevalentDoctorAssignment.getDoctor() != null ? prevalentDoctorAssignment.getDoctor().getId() : null)
                        .prevalentDoctorName(prevalentDoctorAssignment != null && prevalentDoctorAssignment.getDoctor() != null ? prevalentDoctorAssignment.getDoctor().getFullName() : null)
                        .doctorId(prevalentDoctorAssignment != null && prevalentDoctorAssignment.getDoctor() != null ? prevalentDoctorAssignment.getDoctor().getId() : null)
                        .doctorName(prevalentDoctorAssignment != null && prevalentDoctorAssignment.getDoctor() != null ? prevalentDoctorAssignment.getDoctor().getFullName() : null)
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
            List<TherapeuticPlanNurseAssignmentEntity> nurseAssignments,
            List<TherapeuticPlanDoctorAssignmentEntity> doctorAssignments,
            List<EquipmentEntity> equipments
    ) {
        TherapeuticPlanEntity entity = new TherapeuticPlanEntity();
        updateEntity(entity, dto, structure, nurseAssignments, doctorAssignments, equipments);
        entity.setId(dto.getId());
        return entity;
    }

    public void updateEntity(
            TherapeuticPlanEntity entity,
            TherapeuticPlanDto dto,
            StructureEntity structure,
            List<TherapeuticPlanNurseAssignmentEntity> nurseAssignments,
            List<TherapeuticPlanDoctorAssignmentEntity> doctorAssignments,
            List<EquipmentEntity> equipments
    ) {
        entity.setPatientId(dto.getPatientId());
        entity.setProjectCode(dto.getProjectCode());
        entity.setEquipments(new ArrayList<>(equipments));
        entity.setStructure(structure);
        syncNurseAssignments(entity, nurseAssignments);
        syncDoctorAssignments(entity, doctorAssignments);
        entity.setDrugCode(dto.getDrugCode());
        entity.setStartDate(dto.getStartDate());
        entity.setEndDate(dto.getEndDate());
        entity.setStatus(dto.getStatus());
        entity.setNotes(dto.getNotes());
    }

    private void syncNurseAssignments(
            TherapeuticPlanEntity entity,
            List<TherapeuticPlanNurseAssignmentEntity> assignments
    ) {
        if (entity.getNurseAssignments() == null) {
            entity.setNurseAssignments(new ArrayList<>());
        }

        List<TherapeuticPlanNurseAssignmentEntity> currentAssignments = entity.getNurseAssignments();
        Set<Long> nurseIdsToKeep = assignments.stream()
                .map(TherapeuticPlanNurseAssignmentEntity::getNurse)
                .filter(Objects::nonNull)
                .map(assignmentNurse -> assignmentNurse.getId())
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toCollection(HashSet::new));

        currentAssignments.removeIf(currentAssignment -> currentAssignment.getNurse() == null
                || currentAssignment.getNurse().getId() == null
                || !nurseIdsToKeep.contains(currentAssignment.getNurse().getId()));

        for (TherapeuticPlanNurseAssignmentEntity assignment : assignments) {
            Long nurseId = assignment.getNurse() != null ? assignment.getNurse().getId() : null;
            TherapeuticPlanNurseAssignmentEntity targetAssignment = currentAssignments.stream()
                    .filter(currentAssignment -> currentAssignment.getNurse() != null)
                    .filter(currentAssignment -> Objects.equals(currentAssignment.getNurse().getId(), nurseId))
                    .findFirst()
                    .orElseGet(() -> {
                        TherapeuticPlanNurseAssignmentEntity newAssignment = new TherapeuticPlanNurseAssignmentEntity();
                        currentAssignments.add(newAssignment);
                        return newAssignment;
                    });

            targetAssignment.setTherapeuticPlan(entity);
            targetAssignment.setNurse(assignment.getNurse());
            targetAssignment.setPriorityIndex(assignment.getPriorityIndex());
        }

        currentAssignments.sort(Comparator.comparing(TherapeuticPlanNurseAssignmentEntity::getPriorityIndex));
    }

    private void syncDoctorAssignments(
            TherapeuticPlanEntity entity,
            List<TherapeuticPlanDoctorAssignmentEntity> assignments
    ) {
        if (entity.getDoctorAssignments() == null) {
            entity.setDoctorAssignments(new ArrayList<>());
        }

        List<TherapeuticPlanDoctorAssignmentEntity> currentAssignments = entity.getDoctorAssignments();
        Set<Long> doctorIdsToKeep = assignments.stream()
                .map(TherapeuticPlanDoctorAssignmentEntity::getDoctor)
                .filter(Objects::nonNull)
                .map(assignmentDoctor -> assignmentDoctor.getId())
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toCollection(HashSet::new));

        currentAssignments.removeIf(currentAssignment -> currentAssignment.getDoctor() == null
                || currentAssignment.getDoctor().getId() == null
                || !doctorIdsToKeep.contains(currentAssignment.getDoctor().getId()));

        for (TherapeuticPlanDoctorAssignmentEntity assignment : assignments) {
            Long doctorId = assignment.getDoctor() != null ? assignment.getDoctor().getId() : null;
            TherapeuticPlanDoctorAssignmentEntity targetAssignment = currentAssignments.stream()
                    .filter(currentAssignment -> currentAssignment.getDoctor() != null)
                    .filter(currentAssignment -> Objects.equals(currentAssignment.getDoctor().getId(), doctorId))
                    .findFirst()
                    .orElseGet(() -> {
                        TherapeuticPlanDoctorAssignmentEntity newAssignment = new TherapeuticPlanDoctorAssignmentEntity();
                        currentAssignments.add(newAssignment);
                        return newAssignment;
                    });

            targetAssignment.setTherapeuticPlan(entity);
            targetAssignment.setDoctor(assignment.getDoctor());
            targetAssignment.setPriorityIndex(assignment.getPriorityIndex());
        }

        currentAssignments.sort(Comparator.comparing(TherapeuticPlanDoctorAssignmentEntity::getPriorityIndex));
    }
}