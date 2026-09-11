package com.qtm.tenants.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Logs DB connection variables at application startup for debugging.
 */
@Component
public class StartupLogger implements ApplicationListener<ApplicationReadyEvent> {

    private static final Logger log = LoggerFactory.getLogger(StartupLogger.class);

    private final Environment env;

    public StartupLogger(Environment env) {
        this.env = env;
    }

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        String dbHost = env.getProperty("DB_HOST", env.getProperty("SPRING_DATASOURCE_HOST", "<not-set>"));
        String dbPort = env.getProperty("DB_PORT", env.getProperty("SPRING_DATASOURCE_PORT", "<not-set>"));
        String dbName = env.getProperty("DB_NAME", env.getProperty("SPRING_DATASOURCE_NAME", "<not-set>"));
        String dbUser = env.getProperty("DB_USERNAME", env.getProperty("SPRING_DATASOURCE_USERNAME", "<not-set>"));
        String dbPassword = env.getProperty("DB_PASSWORD", env.getProperty("SPRING_DATASOURCE_PASSWORD", "<not-set>"));

        log.info("Database connection (debug): host='{}' port='{}' name='{}' user='{}' password='{}'",
                dbHost, dbPort, dbName, dbUser, dbPassword);
    }
}
