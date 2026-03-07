package com.qtm.tenants.structure.service;

import com.qtm.tenants.structure.StructureType;
import com.qtm.tenants.structure.dto.StructureDto;
import com.qtm.tenants.structure.entity.StructureEntity;
import com.qtm.tenants.structure.mapper.StructureMapper;
import com.qtm.tenants.structure.repository.StructureRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.Mockito.when;

/**
 * Test del service strutture: verifica gestione CRUD di base.
 */
@ExtendWith(MockitoExtension.class)
class StructureServiceTest {

    @Mock
    private StructureRepository structureRepository;

    @Mock
    private StructureTypeRegistry structureTypeRegistry;

    private StructureService structureService;

    @BeforeEach
    void setUp() {
        structureService = new StructureService(structureRepository, new StructureMapper(structureTypeRegistry), structureTypeRegistry);
    }

    @Test
    void shouldCreateAndReadStructure() {
        StructureEntity saved = new StructureEntity();
        saved.setId(1L);
        saved.setCode("ASL-ROMA");
        saved.setName("Poliambulatorio Roma");
        saved.setAddress("Via Roma 10");
        saved.setStructureType("ASL");

        StructureType aslType = new StructureType(
            "ASL",
            "Azienda Sanitaria Locale",
            "Nodo capofila territoriale",
            null,
            null
        );

        when(structureRepository.save(any(StructureEntity.class))).thenReturn(saved);
        when(structureRepository.findById(1L)).thenReturn(Optional.of(saved));
        when(structureRepository.findByCode("ASL-ROMA")).thenReturn(Optional.empty());
        when(structureRepository.findAll()).thenReturn(List.of(saved));
        when(structureRepository.findAllById(anyIterable())).thenReturn(List.of());
        when(structureTypeRegistry.getRequiredByCode("ASL")).thenReturn(aslType);
        when(structureTypeRegistry.findByCode("ASL")).thenReturn(Optional.of(aslType));

        StructureDto toCreate = new StructureDto();
        toCreate.setCode("ASL-ROMA");
        toCreate.setName("Poliambulatorio Roma");
        toCreate.setAddress("Via Roma 10");
        toCreate.setStructureType("ASL");

        StructureDto created = structureService.create(toCreate);
        StructureDto loaded = structureService.findById(1L);

        assertThat(created.getId()).isEqualTo(1L);
        assertThat(loaded.getName()).isEqualTo("Poliambulatorio Roma");
        assertThat(structureService.findAll(null, null)).hasSize(1);
    }
}
