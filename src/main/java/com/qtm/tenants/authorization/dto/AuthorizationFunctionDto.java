package com.qtm.tenants.authorization.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO funzione autorizzabile con relativo scope.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthorizationFunctionDto {

    private String functionCode;
    private String functionName;
    private String authorization;
    private boolean commonFunction;
}