package com.qtm.tenants.nurse.mapper;

import com.qtm.tenants.nurse.dto.NurseDto;
import com.qtm.tenants.nurse.entity.NurseEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper infermiere entity/dto.
 */
@Component
public class NurseMapper {

    public NurseDto toDto(NurseEntity entity) {
        NurseDto dto = new NurseDto();
        dto.setId(entity.getId());
        dto.setNurseProjectId(entity.getNurseProjectId());
        dto.setFullName(entity.getFullName());
        dto.setEmail(entity.getEmail());
        dto.setPrimaryPhone(entity.getPrimaryPhone());
        dto.setSecondaryPhone(entity.getSecondaryPhone());
        dto.setRegion(entity.getRegion());
        dto.setProvince(entity.getProvince());
        dto.setCoverageArea(entity.getCoverageArea());
        dto.setReferenceProvider(entity.getReferenceProvider());
        dto.setProfessionalRegister(entity.getProfessionalRegister());
        dto.setEnabled(entity.getEnabled());
        return dto;
    }

    public NurseEntity toEntity(NurseDto dto) {
        NurseEntity entity = new NurseEntity();
        entity.setId(dto.getId());
        entity.setNurseProjectId(dto.getNurseProjectId());
        entity.setFullName(dto.getFullName());
        entity.setEmail(dto.getEmail());
        entity.setPrimaryPhone(dto.getPrimaryPhone());
        entity.setSecondaryPhone(dto.getSecondaryPhone());
        entity.setRegion(dto.getRegion());
        entity.setProvince(dto.getProvince());
        entity.setCoverageArea(dto.getCoverageArea());
        entity.setReferenceProvider(dto.getReferenceProvider());
        entity.setProfessionalRegister(dto.getProfessionalRegister());
        entity.setEnabled(dto.getEnabled());
        return entity;
    }
}
