package com.qtm.tenants.config;

import lombok.extern.slf4j.Slf4j;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Collection;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

/**
 * Configurazione security come resource server JWT per token condivisi con qtm-dashboard.
 */
@Configuration
@EnableMethodSecurity
@Slf4j
public class SecurityConfig {

    private final List<String> allowedOriginPatterns;

    public SecurityConfig(
            @Value("${app.cors.allowed-origins:http://localhost:4207,http://localhost:4200,http://localhost:4201,https://tenants.qtmdev.quicare.com}")
            String allowedOrigins
    ) {
        this.allowedOriginPatterns = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {
                })
            .addFilterBefore(new SecurityRequestTraceFilter(), BearerTokenAuthenticationFilter.class)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/error", "/actuator/**", "/api/tenants/users/otp/send", "/api/tenants/users/otp/check").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(exceptionHandling -> exceptionHandling
                    .authenticationEntryPoint(authenticationEntryPoint())
                    .accessDeniedHandler((request, response, exception) -> {
                        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                        log.warn("[SecurityConfig] Accesso negato path={} method={} remote={} reason={} selectedRole={} selectedClient={} selectedProject={} principalName={} authorities={} jwtSubject={} jwtPreferredUsername={} jwtRealmRoles={}",
                            request.getRequestURI(),
                            request.getMethod(),
                            request.getRemoteAddr(),
                            exception.getMessage(),
                            request.getHeader("X-Selected-Role"),
                            request.getHeader("X-Selected-Client"),
                            request.getHeader("X-Selected-Project"),
                            authentication == null ? null : authentication.getName(),
                            authentication == null ? List.of() : authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList(),
                            extractJwtSubject(authentication),
                            extractJwtPreferredUsername(authentication),
                            extractJwtRealmRoles(authentication));
                        response.sendError(HttpServletResponse.SC_FORBIDDEN);
                    }))
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {
                }));
        return http.build();
    }

            @Bean
            public AuthenticationEntryPoint authenticationEntryPoint() {
            return (request, response, exception) -> {
                log.warn("[SecurityConfig] Richiesta non autenticata path={} method={} remote={} authHeaderPresent={} reason={}",
                    request.getRequestURI(),
                    request.getMethod(),
                    request.getRemoteAddr(),
                    request.getHeader("Authorization") != null,
                    exception.getMessage());
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            };
            }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(allowedOriginPatterns);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Selected-Role", "X-Selected-Client", "X-Selected-Project"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private String extractJwtSubject(Authentication authentication) {
        Jwt jwt = extractJwt(authentication);
        return jwt == null ? null : jwt.getSubject();
    }

    private String extractJwtPreferredUsername(Authentication authentication) {
        Jwt jwt = extractJwt(authentication);
        return jwt == null ? null : jwt.getClaimAsString("preferred_username");
    }

    private List<String> extractJwtRealmRoles(Authentication authentication) {
        Jwt jwt = extractJwt(authentication);
        if (jwt == null) {
            return List.of();
        }

        Object realmAccess = jwt.getClaim("realm_access");
        if (realmAccess instanceof Map<?, ?> map) {
            Object roles = map.get("roles");
            if (roles instanceof Collection<?> values) {
                return values.stream().map(String::valueOf).toList();
            }
        }

        return Stream.of("roles", "role", "authorities")
                .map(jwt::getClaim)
                .flatMap(claim -> {
                    if (claim instanceof Collection<?> values) {
                        return values.stream().map(String::valueOf);
                    }
                    if (claim instanceof String value) {
                        return Stream.of(value);
                    }
                    return Stream.empty();
                })
                .distinct()
                .toList();
    }

    private Jwt extractJwt(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        return authentication.getPrincipal() instanceof Jwt jwt ? jwt : null;
    }
}
