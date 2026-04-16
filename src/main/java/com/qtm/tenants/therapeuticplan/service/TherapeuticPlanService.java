package com.qtm.tenants.therapeuticplan.service;

import com.qtm.tenants.doctor.entity.DoctorEntity;
import com.qtm.tenants.doctor.repository.DoctorRepository;
import com.qtm.tenants.equipment.EquipmentStatusRules;
import com.qtm.tenants.equipment.entity.EquipmentEntity;
import com.qtm.tenants.equipment.repository.EquipmentRepository;
import com.qtm.tenants.nurse.entity.NurseEntity;
import com.qtm.tenants.nurse.repository.NurseRepository;
import com.qtm.tenants.patient.service.DashboardPatientClient;
import com.qtm.tenants.structure.entity.StructureEntity;
import com.qtm.tenants.structure.repository.StructureRepository;
import com.qtm.tenants.therapeuticplan.TherapeuticPlanStatusRules;
import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanDto;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import com.qtm.tenants.therapeuticplan.mapper.TherapeuticPlanMapper;
import com.qtm.tenants.therapeuticplan.repository.TherapeuticPlanRepository;
import com.qtm.commonlib.dto.PatientDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service orchestratore dei piani terapeutici con validazioni di dominio e sincronizzazione delle attrezzature assegnate.
 */
@Service
@RequiredArgsConstructor
public class TherapeuticPlanService {

    private static final Set<String> ALLOWED_STRUCTURE_TYPES = Set.of("HOSPITAL", "SPECIALIST_CLINIC");

    private final TherapeuticPlanRepository therapeuticPlanRepository;
    private final DashboardPatientClient dashboardPatientClient;
    private final StructureRepository structureRepository;
    private final NurseRepository nurseRepository;
    private final DoctorRepository doctorRepository;
    private final EquipmentRepository equipmentRepository;
    private final TherapeuticPlanMapper therapeuticPlanMapper;

    @Transactional(readOnly = true)
    public List<TherapeuticPlanDto> findAll(String patientName, String projectCode, String status, String drugCode) {
        String normalizedPatientName = normalizeFilter(patientName);
        List<TherapeuticPlanEntity> therapeuticPlans = therapeuticPlanRepository.searchByFilters(
                        normalizeFilter(projectCode),
                        normalizeStatusFilter(status),
                        normalizeFilter(drugCode)
            );
        Map<Long, PatientDto> patientsById = loadPatientsByIds(therapeuticPlans.stream()
            .map(TherapeuticPlanEntity::getPatientId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet()));

        return therapeuticPlans.stream()
            .map(entity -> therapeuticPlanMapper.toDto(entity, buildPatientDisplayName(patientsById.get(entity.getPatientId()))))
            .filter(dto -> matchesPatientName(dto.getPatientDisplayName(), normalizedPatientName))
            .toList();
    }

    @Transactional(readOnly = true)
    public TherapeuticPlanDto findById(Long id) {
        return therapeuticPlanRepository.findById(requireId(id))
            .map(entity -> therapeuticPlanMapper.toDto(entity, resolvePatientDisplayName(entity.getPatientId())))
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Piano terapeutico non trovato"));
    }

    @Transactional
    public TherapeuticPlanDto create(TherapeuticPlanDto dto) {
        TherapeuticPlanDto normalizedDto = normalizeDto(dto);
        validatePatientExists(normalizedDto.getPatientId());
        StructureEntity structure = resolveStructure(normalizedDto.getStructureId());
        NurseEntity nurse = resolveNurse(normalizedDto.getNurseId());
        DoctorEntity doctor = resolveDoctor(normalizedDto.getDoctorId());
        List<EquipmentEntity> selectedEquipments = resolveEquipments(normalizedDto.getEquipmentIds(), Set.of());

        synchronizeEquipmentStatuses(List.of(), selectedEquipments);
        TherapeuticPlanEntity entity = therapeuticPlanMapper.toNewEntity(
                normalizedDto,
                structure,
                nurse,
                doctor,
                selectedEquipments
        );
        TherapeuticPlanEntity savedEntity = therapeuticPlanRepository.save(entity);
        return therapeuticPlanMapper.toDto(savedEntity, resolvePatientDisplayName(savedEntity.getPatientId()));
    }

    @Transactional
    public TherapeuticPlanDto update(Long id, TherapeuticPlanDto dto) {
        Long therapeuticPlanId = requireId(id);
        TherapeuticPlanEntity entity = therapeuticPlanRepository.findById(therapeuticPlanId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Piano terapeutico non trovato"));

        TherapeuticPlanDto normalizedDto = normalizeDto(dto);
    validatePatientExists(normalizedDto.getPatientId());
        StructureEntity structure = resolveStructure(normalizedDto.getStructureId());
        NurseEntity nurse = resolveNurse(normalizedDto.getNurseId());
        DoctorEntity doctor = resolveDoctor(normalizedDto.getDoctorId());
        List<EquipmentEntity> currentEquipments = entity.getEquipments() == null
                ? List.of()
                : List.copyOf(entity.getEquipments());
        Set<Long> currentEquipmentIds = currentEquipments.stream()
                .map(EquipmentEntity::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        List<EquipmentEntity> selectedEquipments = resolveEquipments(normalizedDto.getEquipmentIds(), currentEquipmentIds);

        synchronizeEquipmentStatuses(currentEquipments, selectedEquipments);
        therapeuticPlanMapper.updateEntity(
                entity,
                normalizedDto,
                structure,
                nurse,
                doctor,
                selectedEquipments
        );
        TherapeuticPlanEntity savedEntity = therapeuticPlanRepository.save(entity);
        return therapeuticPlanMapper.toDto(savedEntity, resolvePatientDisplayName(savedEntity.getPatientId()));
    }

    @Transactional
    public void delete(Long id) {
        TherapeuticPlanEntity entity = therapeuticPlanRepository.findById(requireId(id))
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Piano terapeutico non trovato"));

        synchronizeEquipmentStatuses(entity.getEquipments(), List.of());
        therapeuticPlanRepository.delete(entity);
    }

    private TherapeuticPlanDto normalizeDto(TherapeuticPlanDto dto) {
        if (dto == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Payload piano terapeutico obbligatorio");
        }

        LocalDate startDate = dto.getStartDate();
        LocalDate endDate = dto.getEndDate();
        if (startDate == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Data inizio obbligatoria");
        }
        if (endDate != null && endDate.isBefore(startDate)) {
            throw new ResponseStatusException(BAD_REQUEST, "La data fine non puo precedere la data inizio");
        }

        return TherapeuticPlanDto.builder()
                .id(dto.getId())
                .patientId(dto.getPatientId())
                .projectCode(normalizeRequiredText(dto.getProjectCode(), "Progetto obbligatorio"))
                .equipmentIds(normalizeEquipmentIds(dto.getEquipmentIds()))
                .structureId(dto.getStructureId())
                .nurseId(dto.getNurseId())
                .doctorId(dto.getDoctorId())
                .drugCode(normalizeRequiredText(dto.getDrugCode(), "Codice farmaco obbligatorio"))
                .startDate(startDate)
                .endDate(endDate)
                .status(normalizeStatus(dto.getStatus()))
                .notes(normalizeOptionalText(dto.getNotes()))
                .build();
    }

    private void validatePatientExists(Long patientId) {
        if (patientId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Paziente obbligatorio");
        }

        try {
            PatientDto dashboardPatient = dashboardPatientClient.findById(patientId);
            if (dashboardPatient == null) {
                throw new ResponseStatusException(BAD_REQUEST, "Paziente non trovato");
            }
        } catch (ResponseStatusException exception) {
            if (exception.getStatusCode() == NOT_FOUND) {
                throw new ResponseStatusException(BAD_REQUEST, "Paziente non trovato", exception);
            }
            throw exception;
        }
    }

    private Map<Long, PatientDto> loadPatientsByIds(Set<Long> patientIds) {
        if (patientIds.isEmpty()) {
            return Map.of();
        }

        return Optional.ofNullable(dashboardPatientClient.findAll())
                .orElseGet(List::of)
                .stream()
                .filter(Objects::nonNull)
                .filter(patient -> patient.getId() != null)
                .filter(patient -> patientIds.contains(patient.getId()))
                .collect(Collectors.toMap(PatientDto::getId, Function.identity(), (left, right) -> left, HashMap::new));
    }

    private String resolvePatientDisplayName(Long patientId) {
        if (patientId == null) {
            return null;
        }

        try {
            return buildPatientDisplayName(dashboardPatientClient.findById(patientId));
        } catch (ResponseStatusException exception) {
            if (exception.getStatusCode() == NOT_FOUND) {
                return null;
            }
            throw exception;
        }
    }

    private String buildPatientDisplayName(PatientDto patient) {
        if (patient == null) {
            return null;
        }

        String fullName = String.join(" ",
                patient.getFirstName() == null ? "" : patient.getFirstName().trim(),
                patient.getLastName() == null ? "" : patient.getLastName().trim()
        ).trim();

        if (patient.getAssistedId() == null || patient.getAssistedId().isBlank()) {
            return fullName;
        }

        return fullName.isBlank() ? patient.getAssistedId().trim() : fullName + " (" + patient.getAssistedId().trim() + ")";
    }

    private boolean matchesPatientName(String patientDisplayName, String patientNameFilter) {
        if (patientNameFilter == null || patientNameFilter.isBlank()) {
            return true;
        }
        if (patientDisplayName == null || patientDisplayName.isBlank()) {
            return false;
        }

        return patientDisplayName.toLowerCase(Locale.ROOT).contains(patientNameFilter.toLowerCase(Locale.ROOT));
    }

    private StructureEntity resolveStructure(Long structureId) {
        if (structureId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Struttura obbligatoria");
        }

        StructureEntity structure = structureRepository.findById(structureId)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Struttura non trovata"));

        String structureType = structure.getStructureType() == null ? "" : structure.getStructureType().trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_STRUCTURE_TYPES.contains(structureType)) {
            throw new ResponseStatusException(BAD_REQUEST, "La struttura deve essere un ospedale o una specialist clinic");
        }

        if (!Boolean.TRUE.equals(structure.getActive())) {
            throw new ResponseStatusException(BAD_REQUEST, "La struttura selezionata non e attiva");
        }

        return structure;
    }

    private NurseEntity resolveNurse(Long nurseId) {
        if (nurseId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Infermiere obbligatorio");
        }

        NurseEntity nurse = nurseRepository.findById(nurseId)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Infermiere non trovato"));

        if (Boolean.FALSE.equals(nurse.getEnabled())) {
            throw new ResponseStatusException(BAD_REQUEST, "Infermiere non abilitato");
        }

        return nurse;
    }

    private DoctorEntity resolveDoctor(Long doctorId) {
        if (doctorId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Medico obbligatorio");
        }

        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Medico non trovato"));
    }

    private List<EquipmentEntity> resolveEquipments(List<Long> equipmentIds, Set<Long> currentEquipmentIds) {
        List<Long> normalizedEquipmentIds = normalizeEquipmentIds(equipmentIds);
        if (normalizedEquipmentIds.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Selezionare almeno una attrezzatura disponibile");
        }

        Map<Long, EquipmentEntity> equipmentsById = equipmentRepository.findAllById(normalizedEquipmentIds).stream()
                .collect(Collectors.toMap(EquipmentEntity::getId, Function.identity()));

        List<EquipmentEntity> resolvedEquipments = new ArrayList<>();
        for (Long equipmentId : normalizedEquipmentIds) {
            EquipmentEntity equipment = equipmentsById.get(equipmentId);
            if (equipment == null) {
                throw new ResponseStatusException(BAD_REQUEST, "Attrezzatura non trovata: " + equipmentId);
            }

            String normalizedStatus = EquipmentStatusRules.normalizeStatus(equipment.getStatus());
            if (!currentEquipmentIds.contains(equipmentId) && !EquipmentStatusRules.IN_STOCK.equals(normalizedStatus)) {
                throw new ResponseStatusException(BAD_REQUEST, "Attrezzatura non disponibile in magazzino: " + equipment.getCode());
            }

            resolvedEquipments.add(equipment);
        }

        return resolvedEquipments;
    }

    private void synchronizeEquipmentStatuses(List<EquipmentEntity> currentEquipments, List<EquipmentEntity> selectedEquipments) {
        Set<Long> selectedIds = selectedEquipments.stream()
                .map(EquipmentEntity::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<EquipmentEntity> equipmentsToPersist = new ArrayList<>();
        for (EquipmentEntity equipment : currentEquipments) {
            if (equipment.getId() != null && !selectedIds.contains(equipment.getId())) {
                equipment.setStatus(EquipmentStatusRules.IN_STOCK);
                equipmentsToPersist.add(equipment);
            }
        }

        for (EquipmentEntity equipment : selectedEquipments) {
            equipment.setStatus(EquipmentStatusRules.ASSIGNED);
            equipmentsToPersist.add(equipment);
        }

        if (!equipmentsToPersist.isEmpty()) {
            equipmentRepository.saveAll(equipmentsToPersist);
        }
    }

    private List<Long> normalizeEquipmentIds(List<Long> equipmentIds) {
        if (equipmentIds == null) {
            return List.of();
        }

        return equipmentIds.stream()
                .filter(Objects::nonNull)
                .filter(equipmentId -> equipmentId > 0)
                .collect(Collectors.collectingAndThen(
                        Collectors.toCollection(LinkedHashSet::new),
                        ArrayList::new
                ));
    }

    private String normalizeFilter(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeStatusFilter(String value) {
        String normalizedValue = normalizeFilter(value);
        if (normalizedValue.isEmpty()) {
            return "";
        }
        return normalizeStatus(normalizedValue);
    }

    private String normalizeStatus(String value) {
        try {
            return TherapeuticPlanStatusRules.normalizeStatus(value);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, exception.getMessage());
        }
    }

    private String normalizeRequiredText(String value, String message) {
        String normalizedValue = normalizeOptionalText(value);
        if (normalizedValue == null) {
            throw new ResponseStatusException(BAD_REQUEST, message);
        }
        return normalizedValue;
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }

        String normalizedValue = value.trim();
        return normalizedValue.isEmpty() ? null : normalizedValue;
    }

    private Long requireId(Long id) {
        if (id == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Identificativo piano terapeutico obbligatorio");
        }
        return id;
    }
}