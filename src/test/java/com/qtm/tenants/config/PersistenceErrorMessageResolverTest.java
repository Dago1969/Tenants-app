package com.qtm.tenants.config;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifica la traduzione dei principali errori SQLite in messaggi funzionali leggibili dal frontend.
 */
class PersistenceErrorMessageResolverTest {

    private final PersistenceErrorMessageResolver resolver = new PersistenceErrorMessageResolver();

    @Test
    void shouldResolveUniqueConstraintForKnownColumn() {
        DataIntegrityViolationException exception = new DataIntegrityViolationException(
                "db error",
                new RuntimeException("[SQLITE_CONSTRAINT_UNIQUE] UNIQUE constraint failed: users.username")
        );

        PersistenceErrorMessageResolver.ResolvedPersistenceError resolved = resolver.resolve(exception);

        assertThat(resolved.status()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(resolved.detail()).isEqualTo("Valore gia presente per username");
    }

    @Test
    void shouldResolveNotNullConstraintForKnownColumn() {
        DataIntegrityViolationException exception = new DataIntegrityViolationException(
                "db error",
                new RuntimeException("[SQLITE_CONSTRAINT_NOTNULL] NOT NULL constraint failed: structures.address")
        );

        PersistenceErrorMessageResolver.ResolvedPersistenceError resolved = resolver.resolve(exception);

        assertThat(resolved.status()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(resolved.detail()).isEqualTo("Campo obbligatorio mancante: indirizzo struttura");
    }

    @Test
    void shouldResolveForeignKeyConstraint() {
        DataIntegrityViolationException exception = new DataIntegrityViolationException(
                "db error",
                new RuntimeException("[SQLITE_CONSTRAINT_FOREIGNKEY] FOREIGN KEY constraint failed")
        );

        PersistenceErrorMessageResolver.ResolvedPersistenceError resolved = resolver.resolve(exception);

        assertThat(resolved.status()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(resolved.detail()).contains("riferimenti collegati");
    }
}