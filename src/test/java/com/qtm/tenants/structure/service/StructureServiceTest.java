package com.qtm.tenants.structure.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.qtm.tenants.referent.repository.ReferentRepository;
import com.qtm.tenants.structure.StructureType;
import com.qtm.tenants.structure.dto.StructureDto;
import com.qtm.tenants.structure.entity.StructureEntity;
import com.qtm.tenants.structure.mapper.StructureMapper;
import com.qtm.tenants.structure.repository.HospitalDepartmentRepository;
import com.qtm.tenants.structure.repository.StructureRepository;

/**
 * Test del service strutture: verifica gestione CRUD di base.
 */
@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class StructureServiceTest {

    @Mock
    private StructureRepository structureRepository;

    @Mock
    private StructureTypeRegistry structureTypeRegistry;

    @Mock
    private HospitalDepartmentRepository hospitalDepartmentRepository;

    @Mock
    private ReferentRepository referentRepository;

    private StructureService structureService;

    @BeforeEach
    void setUp() {
        structureService = new StructureService(
                structureRepository,
                new StructureMapper(structureTypeRegistry),
                structureTypeRegistry,
                hospitalDepartmentRepository,
                referentRepository
        );
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
            null,
            10
        );

        when(structureRepository.save(org.mockito.ArgumentMatchers.<StructureEntity>any())).thenReturn(saved);
        when(structureRepository.findById(1L)).thenReturn(Optional.of(saved));
        when(structureRepository.findByCode("ASL-ROMA")).thenReturn(Optional.empty());
        when(structureRepository.findAll()).thenReturn(List.of(saved));
        when(structureRepository.findAllById(org.mockito.ArgumentMatchers.<Iterable<Long>>any())).thenReturn(List.of());
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

    @Test
    void shouldReturnStructuresOrderedByTypeImportanceWithTypeInSelectionLabel() {
        StructureType hospitalType = new StructureType(
                "HOSP",
                "Ospedale",
                "Struttura ospedaliera",
                null,
                null,
                1
        );
        StructureType districtType = new StructureType(
                "DIST",
                "Distretto",
                "Struttura territoriale",
                null,
                null,
                5
        );

        StructureEntity district = new StructureEntity();
        district.setId(10L);
        district.setCode("DIST-001");
        district.setName("Distretto Nord");
        district.setStructureType("DIST");
        district.setActive(true);

        StructureEntity hospital = new StructureEntity();
        hospital.setId(20L);
        hospital.setCode("HOSP-001");
        hospital.setName("Ospedale Centrale");
        hospital.setStructureType("HOSP");
        hospital.setActive(true);

        when(structureRepository.findAll()).thenReturn(List.of(district, hospital));
        when(structureRepository.findAllById(argThat((Iterable<Long> ids) -> {
            Set<?> values = ids instanceof Set<?> set ? set : Set.of();
            return values.isEmpty();
        }))).thenReturn(List.of());
        when(structureTypeRegistry.findByCode("DIST")).thenReturn(Optional.of(districtType));
        when(structureTypeRegistry.findByCode("HOSP")).thenReturn(Optional.of(hospitalType));

        List<StructureDto> structures = structureService.findAll(null, null);

        assertThat(structures)
                .extracting(StructureDto::getId)
                .containsExactly(20L, 10L);
        assertThat(structures.get(0).getSelectionLabel()).isEqualTo("Ospedale Centrale - Ospedale");
        assertThat(structures.get(1).getSelectionLabel()).isEqualTo("Distretto Nord - Distretto");
    }

    @Test
    void shouldAcceptLegacyHospitalAliasWhenCreatingStructure() {
        StructureEntity saved = new StructureEntity();
        saved.setId(2L);
        saved.setCode("OSP-001");
        saved.setName("Ospedale Centrale");
        saved.setAddress("Via Roma 10");
        saved.setStructureType("HOSPITAL");

        StructureType hospitalType = new StructureType(
                "HOSPITAL",
                "Struttura Ospedaliera",
                "Centro clinico",
                "ASL",
                "Azienda Sanitaria Locale",
                20
        );

        StructureEntity parentAsl = new StructureEntity();
        parentAsl.setId(6L);
        parentAsl.setStructureType("ASL");
        parentAsl.setName("ASL 2");

        when(structureRepository.findByCode("OSP-001")).thenReturn(Optional.empty());
        when(structureRepository.findById(6L)).thenReturn(Optional.of(parentAsl));
        when(structureRepository.save(org.mockito.ArgumentMatchers.<StructureEntity>any())).thenReturn(saved);
        when(structureTypeRegistry.getRequiredByCode("STRUCTURE_HOSPITAL")).thenReturn(hospitalType);
        when(structureTypeRegistry.findByCode("HOSPITAL")).thenReturn(Optional.of(hospitalType));

        StructureDto toCreate = new StructureDto();
        toCreate.setCode("OSP-001");
        toCreate.setName("Ospedale Centrale");
        toCreate.setAddress("Via Roma 10");
        toCreate.setParentStructureId(6L);
        toCreate.setStructureType("STRUCTURE_HOSPITAL");

        assertThatCode(() -> structureService.create(toCreate)).doesNotThrowAnyException();
    }
}
