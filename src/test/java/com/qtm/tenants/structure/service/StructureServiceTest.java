package com.qtm.tenants.structure.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.qtm.external.client.StructureClient;
import com.qtm.tenants.structure.dto.StructureDto;

/**
 * Test del service strutture delegato al client remoto QTMDB.
 */
@ExtendWith(MockitoExtension.class)
class StructureServiceTest {

    @Mock
    private StructureClient structureClient;

    private StructureService structureService;

    @BeforeEach
    void setUp() {
        structureService = new StructureService(
            structureClient
        );
    }

    @Test
    void shouldFindAllStructuresFromRemoteClient() {
        StructureDto asl = new StructureDto();
        asl.setId(1L);
        asl.setCode("ASL-ROMA");
        asl.setName("Poliambulatorio Roma");
        asl.setStructureType("ASL");
        asl.setActive(true);

        StructureDto hospital = new StructureDto();
        hospital.setId(2L);
        hospital.setCode("HOSP-001");
        hospital.setName("Ospedale Centrale");
        hospital.setStructureType("HOSPITAL");
        hospital.setActive(true);

        when(structureClient.findAll(eq("ASL"), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(List.of(asl));
        when(structureClient.findAll(eq("HOSPITAL"), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(List.of(hospital));

        List<StructureDto> result = structureService.findAll(null, null);

        assertThat(result).hasSize(2);
        assertThat(result).extracting(StructureDto::getId).containsExactly(1L, 2L);
    }

    @Test
    void shouldFindByIdFromRemoteClient() {
        StructureDto hospital = new StructureDto();
        hospital.setId(2L);
        hospital.setCode("HOSP-001");
        hospital.setName("Ospedale Centrale");
        hospital.setStructureType("HOSPITAL");
        hospital.setActive(true);

        when(structureClient.findAll(eq("HOSPITAL"), any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(List.of(hospital));

        StructureDto loaded = structureService.findById(2L);

        assertThat(loaded).isNotNull();
        assertThat(loaded.getName()).isEqualTo("Ospedale Centrale");
    }

    @Test
    void shouldThrowExceptionWhenCreateIsCalled() {
        StructureDto toCreate = new StructureDto();
        toCreate.setCode("ASL-ROMA");

        assertThatThrownBy(() -> structureService.create(toCreate))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("La creazione locale delle strutture è disabilitata");
    }
}