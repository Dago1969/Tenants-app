package com.qtm.tenants.structure.service;

import com.qtm.tenants.structure.StructureType;
import com.qtm.tenants.structure.entity.StructureTypeEntity;
import com.qtm.tenants.structure.repository.StructureTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Registry in memoria dei tipi struttura caricati dal catalogo persistito a database.
 */
@Component
@RequiredArgsConstructor
public class StructureTypeRegistry {

    private final StructureTypeRepository structureTypeRepository;

    private volatile Map<String, StructureType> typesByCode = Map.of();

    @EventListener(ApplicationReadyEvent.class)
    public void refresh() {
        List<StructureTypeEntity> entities = structureTypeRepository.findAllByOrderByDisplayOrderAscCodeAsc();
        Map<String, StructureTypeEntity> entitiesByCode = entities.stream()
                .collect(java.util.stream.Collectors.toMap(
                        entity -> normalizeCode(entity.getCode()),
                        entity -> entity,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        Map<String, StructureType> loadedTypes = new LinkedHashMap<>();
        for (StructureTypeEntity entity : entities) {
            String parentCode = normalizeNullableCode(entity.getParentTypeCode());
            StructureTypeEntity parentEntity = parentCode == null ? null : entitiesByCode.get(parentCode);
            String code = normalizeCode(entity.getCode());
            loadedTypes.put(code, new StructureType(
                    code,
                    entity.getDescription(),
                    entity.getFunctionDescription(),
                    parentCode,
                    parentEntity == null ? null : parentEntity.getDescription()
            ));
        }

        this.typesByCode = loadedTypes;
    }

    public List<StructureType> findAll() {
        ensureLoaded();
        return List.copyOf(typesByCode.values());
    }

    public Optional<StructureType> findByCode(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        ensureLoaded();
        return Optional.ofNullable(typesByCode.get(normalizeCode(code)));
    }

    public StructureType getRequiredByCode(String code) {
        return findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Tipo struttura non supportato: " + code));
    }

    private void ensureLoaded() {
        if (typesByCode.isEmpty()) {
            refresh();
        }
    }

    private String normalizeCode(String code) {
        return code == null ? null : code.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeNullableCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        return normalizeCode(code);
    }
}