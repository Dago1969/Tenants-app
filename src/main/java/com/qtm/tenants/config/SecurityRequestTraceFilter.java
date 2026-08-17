package com.qtm.tenants.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Traccia le richieste API nella catena di Spring Security, inclusi i rifiuti anteriori ai controller.
 */
@Slf4j
public class SecurityRequestTraceFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        if (!request.getRequestURI().startsWith("/api/tenants/")) {
            filterChain.doFilter(request, response);
            return;
        }

        log.info("[SecurityRequestTraceFilter] incoming method={} path={} origin={} authorizationPresent={} selectedRole={} selectedClient={} selectedProject={}",
                request.getMethod(),
                request.getRequestURI(),
                request.getHeader("Origin"),
                request.getHeader("Authorization") != null,
                request.getHeader("X-Selected-Role"),
                request.getHeader("X-Selected-Client"),
                request.getHeader("X-Selected-Project"));
        try {
            filterChain.doFilter(request, response);
        } finally {
            log.info("[SecurityRequestTraceFilter] completed method={} path={} status={}",
                    request.getMethod(),
                    request.getRequestURI(),
                    response.getStatus());
        }
    }
}