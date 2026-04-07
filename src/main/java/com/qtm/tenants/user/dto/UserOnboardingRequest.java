package com.qtm.tenants.user.dto;

import com.qtm.commonlib.dto.UserDto;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO di input per l'onboarding completo utente da wizard tenant, comprensivo di tenant e progetto da associare.
 */
@Getter
@Setter
public class UserOnboardingRequest extends UserDto {

    private Long tenantId;
    private Long projectId;
}