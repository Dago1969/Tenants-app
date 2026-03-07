package com.qtm.tenants.structure.service;

import com.qtm.tenants.structure.StructureType;
import com.qtm.tenants.structure.dto.StructureDto;
import com.qtm.tenants.structure.dto.StructureParentOptionDto;
import com.qtm.tenants.structure.dto.StructureTypeDto;
import com.qtm.tenants.structure.entity.StructureEntity;
import com.qtm.tenants.structure.mapper.StructureMapper;
import com.qtm.tenants.structure.repository.StructureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

    @Transactional
    public StructureDto create(StructureDto structureDto) {
        StructureType structureType = resolveStructureType(structureDto.getStructureType());
        validateCodeUniqueness(structureDto.getCode(), null);
        StructureEntity entity = structureMapper.toEntity(structureDto);
        applyParentValidation(entity, structureType);
        StructureEntity saved = structureRepository.save(entity);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<StructureDto> findAll(String structureTypeCode, Long parentStructureId) {
        List<StructureEntity> entities = resolveEntities(structureTypeCode, parentStructureId);
        return toDtos(entities);
    }

    @Transactional(readOnly = true)
    public StructureDto findById(Long id) {
        return toDto(findEntityById(id));
    }

    @Transactional
    public StructureDto update(Long id, StructureDto structureDto) {
        StructureEntity current = findEntityById(id);
        StructureType structureType = resolveStructureType(structureDto.getStructureType());
        validateCodeUniqueness(structureDto.getCode(), id);
        structureMapper.updateEntity(current, structureDto);
        applyParentValidation(current, structureType);
        return toDto(structureRepository.save(current));
    }

    @Transactional
    public void delete(Long id) {
        StructureEntity entity = findEntityById(id);
        boolean hasChildren = !structureRepository.findAllByParentStructureIdOrderByNameAsc(id).isEmpty();
        if (hasChildren) {
            throw new ResponseStatusException(BAD_REQUEST, "Impossibile eliminare una struttura che ha strutture figlie collegate");
        }
        structureRepository.delete(entity);
    }

    @Transactional(readOnly = true)
    public List<StructureParentOptionDto> findParentOptions(String structureTypeCode) {
        StructureType structureType = resolveStructureType(structureTypeCode);
        if (structureType.getParentType() == null) {
            return List.of();
        }

        return structureRepository.findAllByStructureTypeOrderByNameAsc(structureType.getParentType()).stream()
                .map(structureMapper::toParentOptionDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StructureTypeDto> findSupportedTypes() {
        return List.of(StructureType.values()).stream()
                .map(structureMapper::toTypeDto)
                .toList();
    }

    private List<StructureEntity> resolveEntities(String structureTypeCode, Long parentStructureId) {
        if (structureTypeCode != null && !structureTypeCode.isBlank()) {
            StructureType structureType = resolveStructureType(structureTypeCode);
            if (parentStructureId != null) {
                return structureRepository.findAllByStructureTypeAndParentStructureIdOrderByNameAsc(structureType, parentStructureId);
            }
            return structureRepository.findAllByStructureTypeOrderByNameAsc(structureType);
        }

        if (parentStructureId != null) {
            return structureRepository.findAllByParentStructureIdOrderByNameAsc(parentStructureId);
        }

        return structureRepository.findAll().stream()
                .sorted((left, right) -> left.getName().compareToIgnoreCase(right.getName()))
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
                .map(entity -> structureMapper.toDto(entity, parentNamesById.get(entity.getParentStructureId())))
                .toList();
    }

    private StructureDto toDto(StructureEntity entity) {
        String parentName = entity.getParentStructureId() == null
                ? null
                : structureRepository.findById(entity.getParentStructureId()).map(StructureEntity::getName).orElse(null);
        return structureMapper.toDto(entity, parentName);
    }

    private void applyParentValidation(StructureEntity entity, StructureType structureType) {
        StructureType expectedParentType = structureType.getParentType();
        Long parentStructureId = entity.getParentStructureId();

        if (expectedParentType == null) {
            entity.setParentStructureId(null);
            return;
        }

        if (parentStructureId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "La struttura di tipo " + structureType.getDescription() + " richiede una struttura parent");
        }

        StructureEntity parent = findEntityById(parentStructureId);
        if (parent.getStructureType() != expectedParentType) {
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
            return StructureType.fromCode(structureTypeCode);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, exception.getMessage());
        }
    }

    private StructureEntity findEntityById(Long id) {
        return structureRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Struttura non trovata"));
    }
}
