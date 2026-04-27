package com.qtm.tenants.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;

/**
 * Centralizza la trasformazione delle eccezioni applicative e di persistenza in risposte REST leggibili dal frontend.
 */
@RestControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class ApiExceptionHandler {

    private final PersistenceErrorMessageResolver persistenceErrorMessageResolver;

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail handleResponseStatusException(ResponseStatusException exception) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        String reason = exception.getReason();
        String detail = reason == null || reason.isBlank()
                ? status.getReasonPhrase()
            : reason;
        log.warn("[ApiExceptionHandler] status={} detail={} cause={}", status.value(), detail,
            exception.getCause() == null ? null : exception.getCause().getClass().getSimpleName());
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(status, detail);
        problemDetail.setTitle(status.getReasonPhrase());
        return problemDetail;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrityViolationException(DataIntegrityViolationException exception) {
        PersistenceErrorMessageResolver.ResolvedPersistenceError resolvedError = persistenceErrorMessageResolver.resolve(exception);
        HttpStatus status = Objects.requireNonNull(resolvedError.status(), "Persistence status non disponibile");
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(status, resolvedError.detail());
        problemDetail.setTitle(status.getReasonPhrase());
        return problemDetail;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgumentException(IllegalArgumentException exception) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
        problemDetail.setTitle(HttpStatus.BAD_REQUEST.getReasonPhrase());
        return problemDetail;
    }
}