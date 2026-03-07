package com.qtm.tenants.structure.mapper;

import com.qtm.tenants.structure.StructureType;
import com.qtm.tenants.structure.dto.StructureDto;
import com.qtm.tenants.structure.dto.StructureParentOptionDto;
import com.qtm.tenants.structure.dto.StructureTypeDto;
import com.qtm.tenants.structure.entity.StructureEntity;
import com.qtm.tenants.structure.service.StructureTypeRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Mapper struttura entity/dto con decoding del tipo e del parent.
 */
@Component
@RequiredArgsConstructor
public class StructureMapper {

    private final StructureTypeRegistry structureTypeRegistry;

    public StructureDto toDto(StructureEntity entity, String parentStructureName) {
        StructureDto dto = new StructureDto();
        StructureType structureType = entity.getStructureType() == null
                ? null
                : structureTypeRegistry.findByCode(entity.getStructureType()).orElse(null);
        dto.setId(entity.getId());
        dto.setCode(entity.getCode());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setAddress(entity.getAddress());
        dto.setCity(entity.getCity());
        dto.setProvince(entity.getProvince());
        dto.setRegion(entity.getRegion());
        dto.setPhone(entity.getPhone());
        dto.setEmail(entity.getEmail());
        dto.setActive(Boolean.TRUE.equals(entity.getActive()));
        dto.setStructureType(structureType == null ? entity.getStructureType() : structureType.getCode());
        dto.setStructureTypeDescription(structureType == null ? null : structureType.getDescription());
        dto.setFunctionDescription(structureType == null ? null : structureType.getFunctionDescription());
        dto.setParentStructureId(entity.getParentStructureId());
        dto.setParentStructureName(parentStructureName);
        return dto;
    }

    public StructureEntity toEntity(StructureDto dto) {
        StructureEntity entity = new StructureEntity();
        entity.setId(dto.getId());
        updateEntity(entity, dto);
        return entity;
    }

    public void updateEntity(StructureEntity entity, StructureDto dto) {
        entity.setCode(dto.getCode());
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setAddress(dto.getAddress());
        entity.setCity(dto.getCity());
        entity.setProvince(dto.getProvince());
        entity.setRegion(dto.getRegion());
        entity.setPhone(dto.getPhone());
        entity.setEmail(dto.getEmail());
        entity.setActive(dto.isActive());
        entity.setParentStructureId(dto.getParentStructureId());
        entity.setStructureType(structureTypeRegistry.getRequiredByCode(dto.getStructureType()).getCode());
    }

    public StructureTypeDto toTypeDto(StructureType type) {
        return new StructureTypeDto(
            type.getCode(),
                type.getDescription(),
                type.getFunctionDescription(),
            type.getParentTypeCode(),
            type.getParentTypeDescription()
        );
    }

    public StructureParentOptionDto toParentOptionDto(StructureEntity entity) {
        StructureType structureType = entity.getStructureType() == null
            ? null
            : structureTypeRegistry.findByCode(entity.getStructureType()).orElse(null);
        return new StructureParentOptionDto(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
            structureType == null ? entity.getStructureType() : structureType.getCode(),
            structureType == null ? null : structureType.getDescription()
        );
    }
}
