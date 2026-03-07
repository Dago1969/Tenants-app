package com.qtm.tenants.authorization.mapper;

import com.qtm.tenants.authorization.dto.FunctionModuleRoleAuthorizationDto;
import com.qtm.tenants.authorization.entity.FunctionModuleRoleAuthorizationEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper per conversione tra entity e DTO di autorizzazioni funzioni-modulo-ruolo.
 */
@Component
public class FunctionModuleRoleAuthorizationMapper {
    public FunctionModuleRoleAuthorizationDto toDto(FunctionModuleRoleAuthorizationEntity entity) {
        if (entity == null) {
            return null;
        }

        FunctionModuleRoleAuthorizationDto dto = new FunctionModuleRoleAuthorizationDto();
        dto.setId(entity.getId());
        dto.setFunctionCode(entity.getFunction().getCode());
        dto.setFunctionName(entity.getFunction().getName());
        dto.setModuleCode(entity.getModule().getCode());
        dto.setModuleName(entity.getModule().getName());
        dto.setRoleId(entity.getRole().getId());
        dto.setRoleName(entity.getRole().getDescription());
        dto.setAuthorization(entity.getAuthorization().toFunctionCode());
        return dto;
    }
}
