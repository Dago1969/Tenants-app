package com.qtm.tenants.user.mapper;

import com.qtm.tenants.user.dto.UserDto;
import com.qtm.tenants.user.entity.UserEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper utente entity/dto.
 */
@Component
public class UserMapper {

    public UserDto toDto(UserEntity entity) {
        UserDto dto = new UserDto();
        dto.setId(entity.getId());
        dto.setUsername(entity.getUsername());
        dto.setEnabled(entity.isEnabled());
        dto.setRoleId(entity.getRole() == null ? null : entity.getRole().getId());
        dto.setStructureId(entity.getStructureId());
        return dto;
    }

    public UserEntity toEntity(UserDto dto) {
        UserEntity entity = new UserEntity();
        entity.setId(dto.getId());
        entity.setUsername(dto.getUsername());
        entity.setEnabled(dto.isEnabled());
        entity.setStructureId(dto.getStructureId());
        return entity;
    }
}
