package com.qtm.tenants;

import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
 
/**
 * Entry point dell'applicazione tenants-app.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class TenantsAppApplication {

    public static void main(String[] args) {
        // Diagnostic prints: show DB-related env/properties before Spring starts
        try {
            String dbHost = System.getenv().getOrDefault("DB_HOST", System.getenv().getOrDefault("SPRING_DATASOURCE_HOST", "<not-set>"));
            String dbPort = System.getenv().getOrDefault("DB_PORT", System.getenv().getOrDefault("SPRING_DATASOURCE_PORT", "<not-set>"));
            String dbName = System.getenv().getOrDefault("DB_NAME", System.getenv().getOrDefault("SPRING_DATASOURCE_NAME", System.getenv().getOrDefault("SPRING_DATASOURCE_URL", "<not-set>")));
            String dbUser = System.getenv().getOrDefault("DB_USERNAME", System.getenv().getOrDefault("SPRING_DATASOURCE_USERNAME", "<not-set>"));
            String dbPass = System.getenv().getOrDefault("DB_PASSWORD", System.getenv().getOrDefault("SPRING_DATASOURCE_PASSWORD", "<not-set>"));
            System.out.println("[diagnostic] DB_HOST=" + dbHost + ", DB_PORT=" + dbPort + ", DB_NAME_OR_URL=" + dbName + ", DB_USER=" + dbUser + ", DB_PASSWORD=" + dbPass);
        } catch (Exception e) {
            System.out.println("[diagnostic] Failed to read env vars: " + e.getMessage());
        }

        SpringApplication.run(TenantsAppApplication.class, args);
    }
}
