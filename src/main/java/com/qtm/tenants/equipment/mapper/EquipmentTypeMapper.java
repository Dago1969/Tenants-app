package com.qtm.tenants.equipment.mapper;

import com.qtm.tenants.equipment.dto.EquipmentTypeDTO;
import com.qtm.tenants.equipment.entity.EquipmentTypeEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Mapper Spring per conversione tra EquipmentTypeEntity e EquipmentTypeDTO.
 */
@Component
public class EquipmentTypeMapper {

    public EquipmentTypeDTO toDto(EquipmentTypeEntity entity) {
        if (entity == null) {
            return null;
        }

        EquipmentTypeDTO dto = new EquipmentTypeDTO();
        dto.setId(entity.getId());
        dto.setCode(entity.getCode());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setUse(entity.getUse());
        dto.setCost(entity.getCost());
        dto.setSupplier(entity.getSupplier());
        dto.setSerialNumberRequired(entity.isSerialNumberRequired());
        dto.setPrincipalJsonPresent(entity.isPrincipalJsonPresent());
        dto.setPrincipalJsonPath(entity.getPrincipalJsonPath());
        dto.setSecondaryJsonPresent(entity.isSecondaryJsonPresent());
        dto.setSecondaryJsonPath(entity.getSecondaryJsonPath());
        dto.setPurchaseDate(entity.getPurchaseDate());
        dto.setStatus(entity.getStatus());
        return dto;
    }

    public EquipmentTypeEntity toEntity(EquipmentTypeDTO dto) {
        if (dto == null) {
            return null;
        }

        EquipmentTypeEntity entity = new EquipmentTypeEntity();
        entity.setId(dto.getId());
        entity.setCode(dto.getCode());
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setUse(dto.getUse());
        entity.setCost(dto.getCost());
        entity.setSupplier(dto.getSupplier());
        entity.setSerialNumberRequired(dto.isSerialNumberRequired());
        entity.setPrincipalJsonPresent(dto.isPrincipalJsonPresent());
        entity.setPrincipalJsonPath(dto.getPrincipalJsonPath());
        entity.setSecondaryJsonPresent(dto.isSecondaryJsonPresent());
        entity.setSecondaryJsonPath(dto.getSecondaryJsonPath());
        entity.setPurchaseDate(dto.getPurchaseDate());
        entity.setStatus(dto.getStatus());
        return entity;
    }

    public List<EquipmentTypeDTO> toDtoList(List<EquipmentTypeEntity> entities) {
        if (entities == null) {
            return List.of();
        }

        return entities.stream()
                .filter(Objects::nonNull)
                .map(this::toDto)
                .collect(Collectors.toList());
    }
}
