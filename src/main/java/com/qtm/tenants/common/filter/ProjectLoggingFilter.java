package com.qtm.tenants.common.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro globale che logga il parametro 'project' se presente in ogni richiesta HTTP.
 */
@Slf4j
@Component
public class ProjectLoggingFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String project = request.getParameter("project");
        log.debug("[ProjectLoggingFilter] Filtro eseguito per {} {}", request.getMethod(), request.getRequestURI());
        if (project != null) {
            log.info("[ProjectLoggingFilter] Parametro 'project' ricevuto: {}", project);
        } else {
            log.info("[ProjectLoggingFilter] Nessun parametro 'project' presente nella richiesta");
        }
        filterChain.doFilter(request, response);
    }
}
