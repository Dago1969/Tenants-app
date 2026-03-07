package com.qtm.tenants.authorization;

/**
 * Scope permesso per moduli, funzioni e campi.
 */
public enum AuthorizationScope {

    ALLOW("allow"),
    DENY("deny"),
    FULL_EDIT("full-edit"),
    READ_ONLY("read-only"),
    HIDE_FIELD("hide-field");

    private final String code;

    AuthorizationScope(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public boolean allowsModuleAccess() {
        return this == ALLOW || this == FULL_EDIT || this == READ_ONLY;
    }

    public boolean allowsFunctionExecution() {
        return this == ALLOW || this == FULL_EDIT;
    }

    public String toModuleCode() {
        return allowsModuleAccess() ? ALLOW.code : DENY.code;
    }

    public String toFunctionCode() {
        return allowsFunctionExecution() ? ALLOW.code : DENY.code;
    }

    public static AuthorizationScope fromCode(String code) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Authorization code non valido");
        }
        for (AuthorizationScope value : values()) {
            if (value.code.equalsIgnoreCase(code)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Authorization code non supportato: " + code);
    }
}
