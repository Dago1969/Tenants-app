package com.qtm.tenants.role.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * DTO di pre-cancellazione ruolo con utenti collegati e ruoli alternativi.
 */
@Getter
@AllArgsConstructor
public class RoleDeleteCheckDto {

    private String roleId;
    private List<RoleDeleteLinkedUserDto> linkedUsers;
    private List<RoleDto> replacementRoles;
}