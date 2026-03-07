package com.qtm.tenants.authorization.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * DTO matrice autorizzazioni per ruolo.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthorizationRoleMatrixDto {

    private String roleId;
    private List<AuthorizationModuleDto> modules;
}
