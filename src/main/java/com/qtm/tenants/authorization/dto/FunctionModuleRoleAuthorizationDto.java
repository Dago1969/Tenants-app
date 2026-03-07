package com.qtm.tenants.authorization.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO per autorizzazioni funzioni-modulo-ruolo.
 */
@Getter
@Setter
@NoArgsConstructor
public class FunctionModuleRoleAuthorizationDto {
    private Long id;
    private String functionCode;
    private String functionName;
    private String moduleCode;
    private String moduleName;
    private String roleId;
    private String roleName;
    private String authorization;
}
