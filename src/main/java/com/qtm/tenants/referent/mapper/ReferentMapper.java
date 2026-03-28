package com.qtm.tenants.referent.mapper;

import com.qtm.tenants.referent.entity.ReferentEntity;
import com.qtm.tenants.referent.dto.ReferentDto;
import org.springframework.stereotype.Component;

/**
 * Mapper per ReferentEntity <-> ReferentDto
 */
@Component
public class ReferentMapper {
    public ReferentDto toDto(ReferentEntity entity) {
        if (entity == null) return null;
        ReferentDto dto = new ReferentDto();
        dto.setId(entity.getId());
        dto.setFirstName(entity.getFirstName());
        dto.setLastName(entity.getLastName());
        dto.setRole(entity.getRole());
        dto.setPhone(entity.getPhone());
        dto.setEmail(entity.getEmail());
        return dto;
    }

    public ReferentEntity toEntity(ReferentDto dto) {
        if (dto == null) return null;
        ReferentEntity entity = new ReferentEntity();
        entity.setId(dto.getId());
        entity.setFirstName(dto.getFirstName());
        entity.setLastName(dto.getLastName());
        entity.setRole(dto.getRole());
        entity.setPhone(dto.getPhone());
        entity.setEmail(dto.getEmail());
        return entity;
    }
}
