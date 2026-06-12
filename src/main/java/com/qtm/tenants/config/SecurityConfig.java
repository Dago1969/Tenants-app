package com.qtm.tenants.config;

import lombok.extern.slf4j.Slf4j;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configurazione security come resource server JWT per token condivisi con qtm-dashboard.
 */
@Configuration
@EnableMethodSecurity
@Slf4j
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {
                })
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/error", "/actuator/**", "/api/tenants/users/otp/send", "/api/tenants/users/otp/check").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(exceptionHandling -> exceptionHandling
                    .authenticationEntryPoint(authenticationEntryPoint())
                    .accessDeniedHandler((request, response, exception) -> {
                        log.warn("[SecurityConfig] Accesso negato path={} method={} remote={} reason={}",
                            request.getRequestURI(),
                            request.getMethod(),
                            request.getRemoteAddr(),
                            exception.getMessage());
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
        configuration.setAllowedOrigins(List.of("http://localhost:4207", "http://localhost:4200", "http://localhost:4201"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Selected-Role", "X-Selected-Client", "X-Selected-Project"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
