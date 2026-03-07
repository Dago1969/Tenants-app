package com.qtm.tenants.authorization;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Persistenza enum autorizzazione con codici richiesti in formato kebab-case.
 */
@Converter(autoApply = true)
public class AuthorizationScopeConverter implements AttributeConverter<AuthorizationScope, String> {

    @Override
    public String convertToDatabaseColumn(AuthorizationScope attribute) {
        return attribute == null ? null : attribute.getCode();
    }

    @Override
    public AuthorizationScope convertToEntityAttribute(String dbData) {
        return dbData == null ? null : AuthorizationScope.fromCode(dbData);
    }
}
