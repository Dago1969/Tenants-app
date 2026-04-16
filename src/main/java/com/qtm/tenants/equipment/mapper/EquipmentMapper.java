package com.qtm.tenants.equipment.mapper;

import com.qtm.tenants.equipment.dto.EquipmentDTO;
import com.qtm.tenants.equipment.entity.EquipmentEntity;
import com.qtm.tenants.equipment.entity.EquipmentTypeEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;

/**
 * Mapper Spring per conversione tra EquipmentEntity e EquipmentDTO.
 */
@Component
public class EquipmentMapper {

    public EquipmentDTO toDto(EquipmentEntity entity) {
        if (entity == null) {
            return null;
        }

        EquipmentTypeEntity equipmentType = entity.getEquipmentType();
        return EquipmentDTO.builder()
                .id(entity.getId())
                .equipmentTypeId(equipmentType != null ? equipmentType.getId() : null)
                .equipmentTypeCode(equipmentType != null ? equipmentType.getCode() : null)
                .equipmentTypeName(equipmentType != null ? equipmentType.getName() : null)
                .code(entity.getCode())
                .status(entity.getStatus())
                .serialNumber(entity.getSerialNumber())
                .location(entity.getLocation())
                .assignedTo(entity.getAssignedTo())
                .purchaseDate(entity.getPurchaseDate())
                .lastRevisionDate(entity.getLastRevisionDate())
                .nextRevisionDate(entity.getNextRevisionDate())
                .notes(entity.getNotes())
                .primaryJson(entity.getPrimaryJson())
                .secondaryJson(entity.getSecondaryJson())
                .build();
    }

    public EquipmentEntity toNewEntity(EquipmentDTO dto, EquipmentTypeEntity equipmentType) {
        EquipmentEntity entity = new EquipmentEntity();
        updateEntity(entity, dto, equipmentType);
        entity.setId(dto.getId());
        return entity;
    }

    public void updateEntity(EquipmentEntity entity, EquipmentDTO dto, EquipmentTypeEntity equipmentType) {
        entity.setEquipmentType(equipmentType);
        entity.setCode(dto.getCode());
        entity.setStatus(dto.getStatus());
        entity.setSerialNumber(dto.getSerialNumber());
        entity.setLocation(dto.getLocation());
        entity.setAssignedTo(dto.getAssignedTo());
        entity.setPurchaseDate(dto.getPurchaseDate());
        entity.setLastRevisionDate(dto.getLastRevisionDate());
        entity.setNextRevisionDate(dto.getNextRevisionDate());
        entity.setNotes(dto.getNotes());
        entity.setPrimaryJson(dto.getPrimaryJson());
        entity.setSecondaryJson(dto.getSecondaryJson());
    }

    public List<EquipmentDTO> toDtoList(List<EquipmentEntity> entities) {
        if (entities == null) {
            return List.of();
        }

        return entities.stream()
                .filter(Objects::nonNull)
                .map(this::toDto)
                .toList();
    }
}