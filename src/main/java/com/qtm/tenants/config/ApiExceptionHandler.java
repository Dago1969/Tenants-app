package com.qtm.tenants.config;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/**
 * Centralizza la trasformazione delle eccezioni applicative e di persistenza in risposte REST leggibili dal frontend.
 */
@RestControllerAdvice
@RequiredArgsConstructor
public class ApiExceptionHandler {

    private final PersistenceErrorMessageResolver persistenceErrorMessageResolver;

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail handleResponseStatusException(ResponseStatusException exception) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        String detail = exception.getReason() == null || exception.getReason().isBlank()
                ? status.getReasonPhrase()
                : exception.getReason();
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(status, detail);
        problemDetail.setTitle(status.getReasonPhrase());
        return problemDetail;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrityViolationException(DataIntegrityViolationException exception) {
        PersistenceErrorMessageResolver.ResolvedPersistenceError resolvedError = persistenceErrorMessageResolver.resolve(exception);
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(resolvedError.status(), resolvedError.detail());
        problemDetail.setTitle(resolvedError.status().getReasonPhrase());
        return problemDetail;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgumentException(IllegalArgumentException exception) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
        problemDetail.setTitle(HttpStatus.BAD_REQUEST.getReasonPhrase());
        return problemDetail;
    }
}