package com.qtm.tenants.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO utente tenant.
 */
@Getter
@Setter
@NoArgsConstructor
public class UserDto {

    private Long id;
    private String username;
    private boolean enabled;
    private String roleId;
    private Long structureId;
}
