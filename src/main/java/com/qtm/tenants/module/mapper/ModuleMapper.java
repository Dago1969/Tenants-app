package com.qtm.tenants.module.mapper;

import com.qtm.tenants.module.dto.ModuleDto;
import com.qtm.tenants.module.entity.ModuleEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper modulo entity/dto.
 */
@Component
public class ModuleMapper {

    public ModuleDto toDto(ModuleEntity entity) {
        ModuleDto dto = new ModuleDto();
        dto.setCode(entity.getCode());
        dto.setName(entity.getName());
        return dto;
    }

    public ModuleEntity toEntity(ModuleDto dto) {
        ModuleEntity entity = new ModuleEntity();
        entity.setCode(dto.getCode());
        entity.setName(dto.getName());
        return entity;
    }
}
