package com.qtm.tenants.function.config;

import com.qtm.tenants.function.entity.FunctionEntity;
import com.qtm.tenants.function.repository.FunctionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Bootstrap dati iniziali per la tabella functions (CRUD, READ, SEARCH e funzioni specifiche).
 */
@Component
@RequiredArgsConstructor
@Order(20)
public class FunctionBootstrap implements CommandLineRunner {

    private final FunctionRepository functionRepository;

    @Override
    @Transactional
    public void run(String... args) {
        List<FunctionEntity> functions = List.of(
                create("CREATE", "Crea"),
                create("READ", "Visualizza"),
                create("UPDATE", "Aggiorna"),
                create("DELETE", "Elimina"),
            create("SEARCH", "Ricerca"),
                create("APPROVE", "Approva")
        );
        for (FunctionEntity function : functions) {
            functionRepository.findById(function.getCode())
                    .orElseGet(() -> functionRepository.save(function));
        }
    }

    private FunctionEntity create(String code, String name) {
        FunctionEntity entity = new FunctionEntity();
        entity.setCode(code);
        entity.setName(name);
        return entity;
    }
}
