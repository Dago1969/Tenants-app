package com.qtm.tenants.structure.mapper;

import com.qtm.tenants.structure.StructureType;
import com.qtm.tenants.structure.dto.StructureDto;
import com.qtm.tenants.structure.dto.StructureParentOptionDto;
import com.qtm.tenants.structure.dto.StructureTypeDto;
import com.qtm.tenants.structure.entity.StructureEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper struttura entity/dto con decoding del tipo e del parent.
 */
@Component
public class StructureMapper {

    public StructureDto toDto(StructureEntity entity, String parentStructureName) {
        StructureDto dto = new StructureDto();
        StructureType structureType = entity.getStructureType();
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
        dto.setStructureType(structureType == null ? null : structureType.name());
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
        entity.setStructureType(StructureType.fromCode(dto.getStructureType()));
    }

    public StructureTypeDto toTypeDto(StructureType type) {
        return new StructureTypeDto(
                type.name(),
                type.getDescription(),
                type.getFunctionDescription(),
                type.getParentType() == null ? null : type.getParentType().name(),
                type.getParentType() == null ? null : type.getParentType().getDescription()
        );
    }

    public StructureParentOptionDto toParentOptionDto(StructureEntity entity) {
        return new StructureParentOptionDto(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getStructureType().name(),
                entity.getStructureType().getDescription()
        );
    }
}
