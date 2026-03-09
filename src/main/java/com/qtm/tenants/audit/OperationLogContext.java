package com.qtm.tenants.audit;

import java.util.Map;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OperationLogContext {

    private final String moduleCode;
    private final String functionCode;
    private final String operation;
    private final String description;
    private final String targetId;
    private final String roleId;
    private final String username;
    private final Map<String, String> metadata;
}
