package com.qtm.tenants.module.service;

import com.qtm.tenants.module.dto.ModuleDto;
import com.qtm.tenants.module.entity.ModuleEntity;
import com.qtm.tenants.module.mapper.ModuleMapper;
import com.qtm.tenants.module.repository.ModuleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Test del service moduli: verifica operazioni create, get e list.
 */
@ExtendWith(MockitoExtension.class)
class ModuleServiceTest {

    @Mock
    private ModuleRepository moduleRepository;

    private ModuleService moduleService;

    @BeforeEach
    void setUp() {
        moduleService = new ModuleService(moduleRepository, new ModuleMapper());
    }

    @Test
    void shouldCreateAndReadModule() {
        ModuleEntity saved = new ModuleEntity();
        saved.setCode("MOD-01");
        saved.setName("Anagrafica");

        when(moduleRepository.save(any(ModuleEntity.class))).thenReturn(saved);
        when(moduleRepository.findById("MOD-01")).thenReturn(Optional.of(saved));
        when(moduleRepository.findAll()).thenReturn(List.of(saved));

        ModuleDto toCreate = new ModuleDto();
        toCreate.setCode("MOD-01");
        toCreate.setName("Anagrafica");

        ModuleDto created = moduleService.create(toCreate);
        ModuleDto loaded = moduleService.findByCode("MOD-01");

        assertThat(created.getCode()).isEqualTo("MOD-01");
        assertThat(loaded.getCode()).isEqualTo("MOD-01");
        assertThat(moduleService.findAll()).hasSize(1);
    }
}
