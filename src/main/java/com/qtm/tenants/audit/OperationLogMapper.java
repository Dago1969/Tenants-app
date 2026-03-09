package com.qtm.tenants.audit;

import org.springframework.stereotype.Component;

/**
 * Mapper tra entity e DTO dei log operativi.
 */
@Component
public class OperationLogMapper {

    public OperationLogDto toDto(OperationLogEntity entity) {
        return OperationLogDto.builder()
                .id(entity.getId())
                .occurredAt(entity.getOccurredAt())
                .moduleCode(entity.getModuleCode())
                .functionCode(entity.getFunctionCode())
                .operation(entity.getOperation())
                .description(entity.getDescription())
                .targetId(entity.getTargetId())
                .roleId(entity.getRoleId())
                .username(entity.getUsername())
                .clientIp(entity.getClientIp())
                .userAgent(entity.getUserAgent())
                .metadata(entity.getMetadata())
                .build();
    }
}