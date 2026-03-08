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
        dto.setSelectionLabel(buildSelectionLabel(entity.getName(), structureType));
        dto.setDescription(entity.getDescription());
        dto.setAddress(entity.getAddress());
        dto.setCityId(entity.getCityId());
        dto.setCity(entity.getCity());
        dto.setProvinceId(entity.getProvinceId());
        dto.setProvince(entity.getProvince());
        dto.setRegionId(entity.getRegionId());
        dto.setRegion(entity.getRegion());
        dto.setPhone(entity.getPhone());
        dto.setEmail(entity.getEmail());
        dto.setActive(Boolean.TRUE.equals(entity.getActive()));
        dto.setStructureType(structureType == null ? entity.getStructureType() : structureType.getCode());
        dto.setStructureTypeDescription(structureType == null ? null : structureType.getDescription());
        dto.setFunctionDescription(structureType == null ? null : structureType.getFunctionDescription());
        dto.setStructureTypeDisplayOrder(structureType == null ? null : structureType.getDisplayOrder());
        dto.setParentStructureId(entity.getParentStructureId());
        dto.setParentStructureName(parentStructureName);
        return dto;
    }

    private String buildSelectionLabel(String structureName, StructureType structureType) {
        if (structureType == null || structureType.getDescription() == null || structureType.getDescription().isBlank()) {
            return structureName;
        }

        return structureName + " - " + structureType.getDescription();
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
        entity.setCityId(dto.getCityId());
        entity.setCity(dto.getCity());
        entity.setProvinceId(dto.getProvinceId());
        entity.setProvince(dto.getProvince());
        entity.setRegionId(dto.getRegionId());
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
                type.getParentTypeDescription(),
                type.getDisplayOrder()
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
