package com.qtm.tenants.config;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifica che il gestore globale esponga al frontend status e detail leggibili per gli errori di persistenza.
 */
class ApiExceptionHandlerTest {

    private final ApiExceptionHandler apiExceptionHandler = new ApiExceptionHandler(new PersistenceErrorMessageResolver());

    @Test
    void shouldReturnReadableProblemDetailForDuplicateValue() {
        DataIntegrityViolationException exception = new DataIntegrityViolationException(
                "db error",
                new RuntimeException("[SQLITE_CONSTRAINT_UNIQUE] UNIQUE constraint failed: functions.code")
        );

        ProblemDetail problemDetail = apiExceptionHandler.handleDataIntegrityViolationException(exception);

        assertThat(problemDetail.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(problemDetail.getDetail()).isEqualTo("Valore gia presente per codice funzione");
        assertThat(problemDetail.getTitle()).isEqualTo(HttpStatus.CONFLICT.getReasonPhrase());
    }
}