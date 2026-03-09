package com.qtm.tenants.audit;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO esposto per la consultazione delle operazioni tracciate.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationLogDto {

    private Long id;
    private Instant occurredAt;
    private String moduleCode;
    private String functionCode;
    private String operation;
    private String description;
    private String targetId;
    private String roleId;
    private String username;
    private String clientIp;
    private String userAgent;
    private String metadata;
}