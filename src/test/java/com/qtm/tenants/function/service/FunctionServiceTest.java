package com.qtm.tenants.function.service;

import com.qtm.tenants.function.dto.FunctionDto;
import com.qtm.tenants.function.entity.FunctionEntity;
import com.qtm.tenants.function.mapper.FunctionMapper;
import com.qtm.tenants.function.repository.FunctionRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Test del service funzioni: verifica operazioni create, get e list.
 */
@ExtendWith(MockitoExtension.class)
class FunctionServiceTest {

    @Mock
    private FunctionRepository functionRepository;

    private FunctionService functionService;

    @BeforeEach
    void setUp() {
        functionService = new FunctionService(functionRepository, new FunctionMapper());
    }

    @Test
    void shouldCreateAndReadFunction() {
        FunctionEntity saved = new FunctionEntity();
        saved.setCode("FUNC-01");
        saved.setName("Gestione menu");

        when(functionRepository.save(any(FunctionEntity.class))).thenReturn(saved);
        when(functionRepository.findById("FUNC-01")).thenReturn(Optional.of(saved));
        when(functionRepository.findAll()).thenReturn(List.of(saved));

        FunctionDto toCreate = new FunctionDto();
        toCreate.setCode("FUNC-01");
        toCreate.setName("Gestione menu");

        FunctionDto created = functionService.create(toCreate);
        FunctionDto loaded = functionService.findByCode("FUNC-01");

        assertThat(created.getCode()).isEqualTo("FUNC-01");
        assertThat(loaded.getCode()).isEqualTo("FUNC-01");
        assertThat(functionService.findAll()).hasSize(1);
    }
}
