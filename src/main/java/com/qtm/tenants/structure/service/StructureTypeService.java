package com.qtm.tenants.structure.service;

import com.qtm.tenants.structure.dto.StructureTypeDto;
import com.qtm.tenants.structure.entity.StructureTypeEntity;
import com.qtm.tenants.structure.mapper.StructureMapper;
import com.qtm.tenants.structure.repository.StructureRepository;
import com.qtm.tenants.structure.repository.StructureTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service CRUD del catalogo tipi struttura gestito da database.
 */
@Service
@RequiredArgsConstructor
public class StructureTypeService {

    private final StructureTypeRepository structureTypeRepository;
    private final StructureRepository structureRepository;
    private final StructureTypeRegistry structureTypeRegistry;
    private final StructureMapper structureMapper;

    @Transactional(readOnly = true)
    public List<StructureTypeDto> findAll(String code, String description) {
        String normalizedCode = normalizeFilter(code);
        String normalizedDescription = normalizeFilter(description);

        return structureTypeRegistry.findAll().stream()
                .filter(type -> matchesFilter(type.getCode(), normalizedCode))
                .filter(type -> matchesFilter(type.getDescription(), normalizedDescription))
                .map(structureMapper::toTypeDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public StructureTypeDto findByCode(String code) {
        return structureTypeRepository.findById(normalizeRequiredCode(code))
                .map(this::toDto)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Tipo struttura non trovato"));
    }

    @Transactional
    public StructureTypeDto create(StructureTypeDto dto) {
        String code = normalizeRequiredCode(dto.getCode());
        validateUpsert(dto, code, true);
        if (structureTypeRepository.existsById(code)) {
            throw new ResponseStatusException(CONFLICT, "Tipo struttura gia presente: " + code);
        }

        StructureTypeEntity entity = new StructureTypeEntity();
        applyChanges(entity, dto, code);
        StructureTypeEntity saved = structureTypeRepository.save(entity);
        structureTypeRegistry.refresh();
        return toDto(saved);
    }

    @Transactional
    public StructureTypeDto update(String code, StructureTypeDto dto) {
        String normalizedCode = normalizeRequiredCode(code);
        if (dto.getCode() != null && !normalizeRequiredCode(dto.getCode()).equals(normalizedCode)) {
            throw new ResponseStatusException(BAD_REQUEST, "Il codice del tipo struttura non puo essere modificato");
        }

        StructureTypeEntity entity = structureTypeRepository.findById(normalizedCode)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Tipo struttura non trovato"));

        validateUpsert(dto, normalizedCode, false);
        applyChanges(entity, dto, normalizedCode);
        StructureTypeEntity saved = structureTypeRepository.save(entity);
        structureTypeRegistry.refresh();
        return toDto(saved);
    }

    @Transactional
    public void delete(String code) {
        String normalizedCode = normalizeRequiredCode(code);
        StructureTypeEntity entity = structureTypeRepository.findById(normalizedCode)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Tipo struttura non trovato"));

        if (structureRepository.existsByStructureType(normalizedCode)) {
            throw new ResponseStatusException(BAD_REQUEST, "Impossibile eliminare un tipo struttura gia utilizzato da strutture esistenti");
        }

        if (structureTypeRepository.existsByParentTypeCode(normalizedCode)) {
            throw new ResponseStatusException(BAD_REQUEST, "Impossibile eliminare un tipo struttura usato come parent da altri tipi");
        }

        structureTypeRepository.delete(entity);
        structureTypeRegistry.refresh();
    }

    private void applyChanges(StructureTypeEntity entity, StructureTypeDto dto, String code) {
        entity.setCode(code);
        entity.setDescription(requireNonBlank(dto.getDescription(), "Descrizione tipo struttura obbligatoria"));
        entity.setFunctionDescription(requireNonBlank(dto.getFunctionDescription(), "Descrizione funzione obbligatoria"));
        entity.setParentTypeCode(normalizeOptionalCode(dto.getParentTypeCode()));
        entity.setDisplayOrder(dto.getDisplayOrder() == null ? 0 : dto.getDisplayOrder());
    }

    private void validateUpsert(StructureTypeDto dto, String code, boolean create) {
        if (dto == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Payload tipo struttura obbligatorio");
        }

        String parentCode = normalizeOptionalCode(dto.getParentTypeCode());
        if (parentCode != null) {
            if (parentCode.equals(code)) {
                throw new ResponseStatusException(BAD_REQUEST, "Il tipo struttura non puo essere parent di se stesso");
            }
            if (!structureTypeRepository.existsById(parentCode)) {
                throw new ResponseStatusException(BAD_REQUEST, "Tipo parent non supportato: " + parentCode);
            }
            validateNoCycle(code, parentCode, create);
        }
    }

    private void validateNoCycle(String currentCode, String parentCode, boolean create) {
        String currentParentCode = parentCode;
        while (currentParentCode != null) {
            if (currentCode.equals(currentParentCode)) {
                throw new ResponseStatusException(BAD_REQUEST, "Relazione parent ciclica non consentita per il tipo struttura " + currentCode);
            }

            currentParentCode = structureTypeRepository.findById(currentParentCode)
                    .map(StructureTypeEntity::getParentTypeCode)
                    .map(this::normalizeOptionalCode)
                    .orElse(null);
        }
    }

    private StructureTypeDto toDto(StructureTypeEntity entity) {
        String parentCode = normalizeOptionalCode(entity.getParentTypeCode());
        String parentDescription = parentCode == null
                ? null
                : structureTypeRepository.findById(parentCode).map(StructureTypeEntity::getDescription).orElse(null);
        return new StructureTypeDto(
                entity.getCode(),
                entity.getDescription(),
                entity.getFunctionDescription(),
                parentCode,
                parentDescription,
                entity.getDisplayOrder()
        );
    }

    private boolean matchesFilter(String value, String filter) {
        if (filter == null) {
            return true;
        }
        return value != null && value.toLowerCase(Locale.ROOT).contains(filter);
    }

    private String normalizeFilter(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeRequiredCode(String code) {
        if (code == null || code.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Codice tipo struttura obbligatorio");
        }
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeOptionalCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, message);
        }
        return value.trim();
    }
}