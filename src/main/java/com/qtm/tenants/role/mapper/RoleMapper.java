package com.qtm.tenants.role.mapper;

import com.qtm.tenants.role.dto.RoleDto;
import com.qtm.tenants.role.entity.RoleEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper ruolo entity/dto.
 */
@Component
public class RoleMapper {

    public RoleDto toDto(RoleEntity entity) {
        RoleDto dto = new RoleDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        return dto;
    }

    public RoleEntity toEntity(RoleDto dto) {
        RoleEntity entity = new RoleEntity();
        entity.setId(dto.getId());
        entity.setName(resolveRoleName(dto));
        entity.setDescription(dto.getDescription());
        return entity;
    }

    private String resolveRoleName(RoleDto dto) {
        if (dto.getName() != null && !dto.getName().isBlank()) {
            return dto.getName();
        }
        return dto.getDescription();
    }
}
