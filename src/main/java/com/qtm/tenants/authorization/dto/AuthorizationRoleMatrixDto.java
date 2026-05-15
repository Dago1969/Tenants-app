package com.qtm.tenants.authorization.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    @JsonProperty("isNurseRole")
    private boolean isNurseRole;
    /**
     * Flag che indica se il ruolo è NURSE_QTM o derivato da NURSE_QTM.
     * Se true, il menu di sinistra nel frontend non deve essere visibile.
     */
}
