package com.qtm.tenants.function.mapper;

import com.qtm.tenants.function.dto.FunctionDto;
import com.qtm.tenants.function.entity.FunctionEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper funzione entity/dto.
 */
@Component
public class FunctionMapper {

    public FunctionDto toDto(FunctionEntity entity) {
        FunctionDto dto = new FunctionDto();
        dto.setCode(entity.getCode());
        dto.setName(entity.getName());
        return dto;
    }

    public FunctionEntity toEntity(FunctionDto dto) {
        FunctionEntity entity = new FunctionEntity();
        entity.setCode(dto.getCode());
        entity.setName(dto.getName());
        return entity;
    }
}
