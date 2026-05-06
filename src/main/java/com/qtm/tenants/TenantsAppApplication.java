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
        SpringApplication.run(TenantsAppApplication.class, args);
    }
}
