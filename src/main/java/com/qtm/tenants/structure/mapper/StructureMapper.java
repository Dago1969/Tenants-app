package com.qtm.tenants.structure.mapper;

import com.qtm.tenants.structure.StructureType;
import com.qtm.tenants.structure.dto.StructureDto;
import com.qtm.tenants.structure.dto.StructureParentOptionDto;
import com.qtm.tenants.structure.dto.StructureTypeDto;
import com.qtm.tenants.structure.entity.StructureEntity;
import com.qtm.tenants.structure.repository.StructureRepository;
import com.qtm.tenants.structure.service.StructureTypeRegistry;
import com.qtm.tenants.referent.mapper.ReferentMapper;
import com.qtm.tenants.referent.repository.ReferentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Mapper struttura entity/dto con decoding del tipo e del parent.
 */
@Component
@RequiredArgsConstructor

public class StructureMapper {
    private final StructureTypeRegistry structureTypeRegistry;
    @Autowired
    private ReferentMapper referentMapper;
    @Autowired
    private ReferentRepository referentRepository;
    @Autowired
    private StructureRepository structureRepository;


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
        dto.setCap(entity.getCap());
        if (entity.getReferents() != null) {
            java.util.List<com.qtm.tenants.referent.dto.ReferentDto> referentDtos = new java.util.ArrayList<>();
            for (com.qtm.tenants.referent.entity.ReferentEntity ref : entity.getReferents()) {
                referentDtos.add(referentMapper.toDto(ref));
            }
            dto.setReferents(referentDtos);
        } else {
            dto.setReferents(new java.util.ArrayList<>());
        }
        dto.setCityId(entity.getCityId());
        dto.setCity(entity.getCity());
        dto.setProvinceId(entity.getProvinceId());
        dto.setProvince(entity.getProvince());
        dto.setRegionId(entity.getRegionId());
        dto.setRegion(entity.getRegion());
        dto.setPhone(entity.getPhone());
        dto.setEmail(entity.getEmail());
        dto.setServiceCalendarHours(entity.getServiceCalendarHours());
        dto.setActive(Boolean.TRUE.equals(entity.getActive()));
        dto.setStructureType(structureType == null ? entity.getStructureType() : structureType.getCode());
        dto.setStructureTypeDescription(structureType == null ? null : structureType.getDescription());
        dto.setFunctionDescription(structureType == null ? null : structureType.getFunctionDescription());
        dto.setStructureTypeDisplayOrder(structureType == null ? null : structureType.getDisplayOrder());
        dto.setParentStructureId(entity.getParentStructureId());
        dto.setParentStructureName(parentStructureName);
        // Pharmacy associations removed: hospital departments are stored in
        // the `hospital_departments` table and exposed via dedicated API.
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
        entity.setCap(dto.getCap());
        // Gestione referenti
        if (dto.getReferents() != null) {
            java.util.List<com.qtm.tenants.referent.entity.ReferentEntity> referentEntities = new java.util.ArrayList<>();
            for (com.qtm.tenants.referent.dto.ReferentDto refDto : dto.getReferents()) {
                if (refDto.getId() != null) {
                    referentRepository.findById(refDto.getId()).ifPresent(referentEntities::add);
                } else {
                    referentEntities.add(referentMapper.toEntity(refDto));
                }
            }
            entity.setReferents(referentEntities);
        } else {
            entity.setReferents(new java.util.ArrayList<>());
        }
        // (Rimosso: gestione singola farmacia, ora gestito come lista pharmacies)
        entity.setCityId(dto.getCityId());
        entity.setCity(dto.getCity());
        entity.setProvinceId(dto.getProvinceId());
        entity.setProvince(dto.getProvince());
        entity.setRegionId(dto.getRegionId());
        entity.setRegion(dto.getRegion());
        entity.setPhone(dto.getPhone());
        entity.setEmail(dto.getEmail());
        entity.setServiceCalendarHours(dto.getServiceCalendarHours());
        entity.setActive(dto.isActive());
        entity.setParentStructureId(dto.getParentStructureId());
        entity.setStructureType(structureTypeRegistry.getRequiredByCode(dto.getStructureType()).getCode());
        // Pharmacy associations removed from entity mapping.
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
