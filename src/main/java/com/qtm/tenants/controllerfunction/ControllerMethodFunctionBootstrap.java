package com.qtm.tenants.controllerfunction;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Bootstrap della configurazione metodo controller -> funzione per allineare i metodi esposti allo startup.
 */
@Component
@RequiredArgsConstructor
@Order(25)
public class ControllerMethodFunctionBootstrap implements CommandLineRunner {

    private final ControllerMethodFunctionService controllerMethodFunctionService;

    @Override
    public void run(String... args) {
        controllerMethodFunctionService.synchronizeAllModules();
    }
}
