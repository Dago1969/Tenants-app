package com.qtm.tenants.authorization;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Test parametrico per AuthorizationScope.
 * Verifica che i valori allow/deny siano gestiti correttamente per moduli e funzioni,
 * e che i valori legacy per i campi restino invariati.
 */
class AuthorizationScopeTest {
    static Stream<String> validScopes() {
        return Stream.of("allow", "deny", "full-edit", "read-only", "hide-field");
    }

    @ParameterizedTest
    @MethodSource("validScopes")
    void testValueOf(String scope) {
        // Per ora test semplice: il metodo valueOf ignora il case e accetta solo valori validi
        assertNotNull(AuthorizationScope.valueOf(scope.replace("-", "_").toUpperCase()));
    }
}
