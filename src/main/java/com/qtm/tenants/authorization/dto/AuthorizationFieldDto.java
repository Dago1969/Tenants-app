package com.qtm.tenants.authorization.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO campo autorizzazione con relativo scope.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthorizationFieldDto {

    private String fieldName;
    private String authorization;
}
