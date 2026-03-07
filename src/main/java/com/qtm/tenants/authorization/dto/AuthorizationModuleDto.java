package com.qtm.tenants.authorization.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * DTO autorizzazioni per singolo modulo.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthorizationModuleDto {

    private String moduleCode;
    private String moduleName;
    private String entityName;
    private String moduleAuthorization;
    private List<AuthorizationFieldDto> fields;
    private List<AuthorizationFunctionDto> functions;
}
