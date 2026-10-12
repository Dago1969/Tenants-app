package com.qtm.tenants;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;
 
/**
 * Entry point dell'applicazione tenants-app.
 */
@SpringBootApplication(scanBasePackages = {"com.qtm.tenants", "com.qtm.external.client"})
@EnableScheduling
@EnableCaching // ABILITA LA CACHE IN SPRING
@ConfigurationPropertiesScan
public class TenantsAppApplication {

    public static void main(String[] args) {
        SpringApplication.run(TenantsAppApplication.class, args);
    }
}
