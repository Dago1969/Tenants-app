package com.qtm.tenants.structure.service;

import com.qtm.tenants.referent.entity.ReferentEntity;
import com.qtm.tenants.referent.repository.ReferentRepository;
import com.qtm.tenants.structure.dto.HospitalDepartmentDto;
import com.qtm.tenants.structure.StructureType;
import com.qtm.tenants.structure.dto.StructureDto;
import com.qtm.tenants.structure.dto.StructureParentOptionDto;
import com.qtm.tenants.structure.dto.StructureTypeDto;
import com.qtm.tenants.structure.entity.HospitalDepartmentEntity;
import com.qtm.tenants.structure.entity.StructureEntity;
import com.qtm.tenants.structure.mapper.StructureMapper;
import com.qtm.tenants.structure.repository.HospitalDepartmentRepository;
import com.qtm.tenants.structure.repository.StructureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Comparator;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service orchestratore CRUD strutture con decoding del tipo e gestione gerarchica parent-child.
 */
@Service
@RequiredArgsConstructor
public class StructureService {

    private final StructureRepository structureRepository;
    private final StructureMapper structureMapper;
    private final StructureTypeRegistry structureTypeRegistry;
    private final HospitalDepartmentRepository hospitalDepartmentRepository;
    private final ReferentRepository referentRepository;

    @Transactional
    public StructureDto create(StructureDto structureDto) {
        StructureType structureType = resolveStructureType(structureDto.getStructureType());
        validateCodeUniqueness(structureDto.getCode(), null);
        StructureEntity entity = structureMapper.toEntity(structureDto);
        applyParentValidation(entity, structureType);
        StructureEntity saved = structureRepository.save(entity);
        syncHospitalDepartments(saved, structureDto.getDepartmentsSelected());
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<StructureDto> findAll(String structureTypeCode, Long parentStructureId) {
        return findAll(structureTypeCode, null, parentStructureId, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<StructureDto> findAll(
            String structureTypeCode,
            String structureTypes,
            Long parentStructureId,
            String code,
            String name,
            String city,
            Boolean active
    ) {
        List<StructureEntity> entities = resolveEntities(structureTypeCode, structureTypes, parentStructureId).stream()
            .filter(entity -> matchesFilter(entity.getCode(), code))
            .filter(entity -> matchesFilter(entity.getName(), name))
            .filter(entity -> matchesFilter(entity.getCity(), city))
            .filter(entity -> active == null || Boolean.TRUE.equals(entity.getActive()) == active)
            .toList();
        return toDtos(entities);
        }

    @Transactional(readOnly = true)
    public StructureDto findById(Long id) {
        return toDto(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public String findStructureTypeCode(Long id) {
        return findEntityById(id).getStructureType();
    }

    @Transactional
    public StructureDto update(Long id, StructureDto structureDto) {
        StructureEntity current = findEntityById(id);
        StructureType structureType = resolveStructureType(structureDto.getStructureType());
        validateCodeUniqueness(structureDto.getCode(), id);
        structureMapper.updateEntity(current, structureDto);
        applyParentValidation(current, structureType);
        StructureEntity saved = structureRepository.save(current);
        syncHospitalDepartments(saved, structureDto.getDepartmentsSelected());
        return toDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        StructureEntity entity = findEntityById(id);
        boolean hasChildren = !structureRepository.findAllByParentStructureIdOrderByNameAsc(id).isEmpty();
        if (hasChildren) {
            throw new ResponseStatusException(BAD_REQUEST, "Impossibile eliminare una struttura che ha strutture figlie collegate");
        }
        hospitalDepartmentRepository.deleteAllByStructureId(id);
        structureRepository.delete(entity);
    }

    @Transactional(readOnly = true)
    public List<StructureParentOptionDto> findParentOptions(String structureTypeCode) {
        StructureType structureType = resolveStructureType(structureTypeCode);
        if (structureType.getParentTypeCode() == null) {
            return List.of();
        }

        return structureRepository.findAllByStructureTypeOrderByNameAsc(structureType.getParentTypeCode()).stream()
                .map(structureMapper::toParentOptionDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StructureTypeDto> findSupportedTypes() {
        return structureTypeRegistry.findAll().stream()
                .map(structureMapper::toTypeDto)
                .toList();
    }

    private List<StructureEntity> resolveEntities(String structureTypeCode, String structureTypes, Long parentStructureId) {
        if (structureTypeCode != null && !structureTypeCode.isBlank()) {
            StructureType structureType = resolveStructureType(structureTypeCode);
            if (parentStructureId != null) {
                return structureRepository.findAllByStructureTypeAndParentStructureIdOrderByNameAsc(structureType.getCode(), parentStructureId);
            }
            return structureRepository.findAllByStructureTypeOrderByNameAsc(structureType.getCode());
        }

        List<String> structureTypeCodes = resolveStructureTypeCodes(structureTypes);
        if (!structureTypeCodes.isEmpty()) {
            if (parentStructureId != null) {
                return structureRepository.findAllByStructureTypeInAndParentStructureIdOrderByNameAsc(structureTypeCodes, parentStructureId);
            }
            return structureRepository.findAllByStructureTypeInOrderByNameAsc(structureTypeCodes);
        }

        if (parentStructureId != null) {
            return structureRepository.findAllByParentStructureIdOrderByNameAsc(parentStructureId);
        }

        return structureRepository.findAll().stream()
                .sorted(structureImportanceComparator())
                .toList();
    }

    private List<StructureDto> toDtos(List<StructureEntity> entities) {
        Set<Long> parentIds = entities.stream()
                .map(StructureEntity::getParentStructureId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, String> parentNamesById = structureRepository.findAllById(parentIds).stream()
                .collect(Collectors.toMap(StructureEntity::getId, StructureEntity::getName, (left, right) -> left, LinkedHashMap::new));

        return entities.stream()
                .map(entity -> enrichWithHospitalDepartments(structureMapper.toDto(entity, parentNamesById.get(entity.getParentStructureId())), entity.getId()))
                .toList();
    }

    private StructureDto toDto(StructureEntity entity) {
        String parentName = entity.getParentStructureId() == null
                ? null
                : structureRepository.findById(entity.getParentStructureId()).map(StructureEntity::getName).orElse(null);
        return enrichWithHospitalDepartments(structureMapper.toDto(entity, parentName), entity.getId());
    }

    private StructureDto enrichWithHospitalDepartments(StructureDto dto, Long structureId) {
        dto.setDepartmentsSelected(loadHospitalDepartments(structureId));
        return dto;
    }

    private List<HospitalDepartmentDto> loadHospitalDepartments(Long structureId) {
        if (structureId == null) {
            return List.of();
        }

        return hospitalDepartmentRepository.findAllByStructureIdOrderByDepartmentIdAsc(structureId).stream()
                .map(this::toHospitalDepartmentDto)
                .toList();
    }

    private HospitalDepartmentDto toHospitalDepartmentDto(HospitalDepartmentEntity entity) {
        HospitalDepartmentDto dto = new HospitalDepartmentDto();
        dto.setDepartmentId(entity.getDepartmentId());
        dto.setReferentId(entity.getReferent() == null ? null : entity.getReferent().getId());
        return dto;
    }

    private void syncHospitalDepartments(StructureEntity structure, List<HospitalDepartmentDto> departmentsSelected) {
        if (structure.getId() == null) {
            return;
        }

        List<HospitalDepartmentEntity> existingDepartments = hospitalDepartmentRepository
                .findAllByStructureIdOrderByDepartmentIdAsc(structure.getId());

        if (!"HOSPITAL".equalsIgnoreCase(structure.getStructureType()) || departmentsSelected == null || departmentsSelected.isEmpty()) {
            if (!existingDepartments.isEmpty()) {
                hospitalDepartmentRepository.deleteAll(existingDepartments);
            }
            return;
        }

        Map<Long, HospitalDepartmentDto> uniqueByDepartmentId = departmentsSelected.stream()
                .filter(item -> item.getDepartmentId() != null)
                .collect(Collectors.toMap(HospitalDepartmentDto::getDepartmentId, item -> item, (left, right) -> right, LinkedHashMap::new));

        if (uniqueByDepartmentId.isEmpty()) {
            if (!existingDepartments.isEmpty()) {
                hospitalDepartmentRepository.deleteAll(existingDepartments);
            }
            return;
        }

        Map<Long, HospitalDepartmentEntity> existingByDepartmentId = existingDepartments.stream()
                .filter(item -> item.getDepartmentId() != null)
                .collect(Collectors.toMap(HospitalDepartmentEntity::getDepartmentId, item -> item, (left, right) -> right, LinkedHashMap::new));

        Set<Long> requestedDepartmentIds = new HashSet<>(uniqueByDepartmentId.keySet());
        List<HospitalDepartmentEntity> departmentsToDelete = existingDepartments.stream()
                .filter(item -> item.getDepartmentId() != null)
                .filter(item -> !requestedDepartmentIds.contains(item.getDepartmentId()))
                .toList();

        if (!departmentsToDelete.isEmpty()) {
            hospitalDepartmentRepository.deleteAll(departmentsToDelete);
        }

        List<HospitalDepartmentEntity> departmentsToCreate = new ArrayList<>();

        for (HospitalDepartmentDto departmentDto : uniqueByDepartmentId.values()) {
            HospitalDepartmentEntity existingEntity = existingByDepartmentId.get(departmentDto.getDepartmentId());
            ReferentEntity referent = resolveReferent(departmentDto.getReferentId());

            if (existingEntity != null) {
                existingEntity.setReferent(referent);
                continue;
            }

            HospitalDepartmentEntity entity = new HospitalDepartmentEntity();
            entity.setStructure(structure);
            entity.setDepartmentId(departmentDto.getDepartmentId());
            entity.setReferent(referent);
            departmentsToCreate.add(entity);
        }

        if (!departmentsToCreate.isEmpty()) {
            hospitalDepartmentRepository.saveAll(departmentsToCreate);
        }
    }

    private ReferentEntity resolveReferent(Long referentId) {
        if (referentId == null) {
            return null;
        }

        return referentRepository.findById(referentId)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Referente non trovato: " + referentId));
    }

    private void applyParentValidation(StructureEntity entity, StructureType structureType) {
        String expectedParentTypeCode = structureType.getParentTypeCode();
        Long parentStructureId = entity.getParentStructureId();

        if (expectedParentTypeCode == null) {
            entity.setParentStructureId(null);
            return;
        }

        if (parentStructureId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "La struttura di tipo " + structureType.getDescription() + " richiede una struttura parent");
        }

        StructureEntity parent = findEntityById(parentStructureId);
        if (!expectedParentTypeCode.equalsIgnoreCase(parent.getStructureType())) {
            StructureType expectedParentType = structureTypeRegistry.getRequiredByCode(expectedParentTypeCode);
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "La struttura parent deve essere di tipo " + expectedParentType.getDescription()
            );
        }
    }

    private void validateCodeUniqueness(String code, Long currentId) {
        if (code == null || code.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Codice struttura obbligatorio");
        }

        structureRepository.findByCode(code.trim())
                .ifPresent(existing -> {
                    if (currentId == null || !existing.getId().equals(currentId)) {
                        throw new ResponseStatusException(CONFLICT, "Codice struttura gia presente: " + code);
                    }
                });
    }

    private StructureType resolveStructureType(String structureTypeCode) {
        if (structureTypeCode == null || structureTypeCode.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Tipo struttura obbligatorio");
        }

        try {
            return structureTypeRegistry.getRequiredByCode(structureTypeCode);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, exception.getMessage());
        }
    }

    private List<String> resolveStructureTypeCodes(String structureTypes) {
        if (structureTypes == null || structureTypes.isBlank()) {
            return List.of();
        }

        return Arrays.stream(structureTypes.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(value -> value.toUpperCase(Locale.ROOT))
                .distinct()
                .map(code -> resolveStructureType(code).getCode())
                .toList();
    }

    private StructureEntity findEntityById(Long id) {
        return structureRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Struttura non trovata"));
    }

    private boolean matchesFilter(String value, String filter) {
        if (filter == null || filter.isBlank()) {
            return true;
        }

        return value != null && value.toLowerCase().contains(filter.trim().toLowerCase());
    }

    private Comparator<StructureEntity> structureImportanceComparator() {
        return Comparator
                .comparingInt(this::resolveDisplayOrder)
                .thenComparing(StructureEntity::getName, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(StructureEntity::getCode, String.CASE_INSENSITIVE_ORDER);
    }

    private int resolveDisplayOrder(StructureEntity entity) {
        if (entity.getStructureType() == null || entity.getStructureType().isBlank()) {
            return Integer.MAX_VALUE;
        }

        return structureTypeRegistry.findByCode(entity.getStructureType())
                .map(StructureType::getDisplayOrder)
                .orElse(Integer.MAX_VALUE);
    }
}
