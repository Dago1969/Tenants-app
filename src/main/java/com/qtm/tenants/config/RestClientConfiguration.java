package com.qtm.tenants.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Expose RestClient.Builder as a Spring bean so services can autowire it.
 */
@Configuration
public class RestClientConfiguration {

    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }

}
