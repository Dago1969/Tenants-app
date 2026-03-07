package com.qtm.tenants.authorization.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * DTO richiesta aggiornamento autorizzazioni per ruolo.
 */
@Getter
@Setter
@NoArgsConstructor
public class AuthorizationUpdateRequestDto {

    private List<AuthorizationModuleDto> modules;
}
