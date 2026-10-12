package com.qtm.tenants.structure.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.qtm.commonlib.dto.ASLDto;
import com.qtm.commonlib.dto.HospitalDto;
import com.qtm.commonlib.dto.HospitalOverviewDto;
import com.qtm.commonlib.dto.StructureDepartmentSourceDto;
import com.qtm.external.client.HealthStructureClient;
import com.qtm.external.client.StructureClient;
import com.qtm.tenants.structure.dto.StructureDto;
import com.qtm.tenants.structure.dto.StructureDepartmentOptionDto;
import com.qtm.tenants.structure.dto.StructureOverviewDto;

/**
 * Test del service strutture delegato al catalogo remoto Health Structure.
 */
@ExtendWith(MockitoExtension.class)
class StructureServiceTest {

    @Mock
    private HealthStructureClient healthStructureClient;

    @Mock
    private StructureClient structureClient;

    private StructureService structureService;

    @BeforeEach
    void setUp() {
        structureService = new StructureService(
            healthStructureClient,
            structureClient
        );
    }

    @Test
    void shouldLoadHospitalOverviewFromDashboard() {
        HospitalOverviewDto hospital = HospitalOverviewDto.builder()
            .id(2L)
            .strutturaId(2L)
            .codiceRegione("09")
            .regione("Toscana")
            .codiceAsl("090601")
            .asl("ASL Toscana")
            .codiceStruttura("090601")
            .struttura("Ospedale Centrale")
            .build();
        when(structureClient.findHospitalOverview("09", null)).thenReturn(List.of(hospital));

        List<StructureOverviewDto> result = structureService.findOverview("09", null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStrutturaId()).isEqualTo(2L);
        assertThat(result.get(0).getCodiceRegione()).isEqualTo("09");
        assertThat(result.get(0).getStruttura()).isEqualTo("Ospedale Centrale");
    }

    @Test
    void shouldLoadDepartmentsForHospitalFromDashboardByStructureCode() {
        HospitalOverviewDto hospital = HospitalOverviewDto.builder()
            .id(191L)
            .strutturaId(191L)
            .codiceStruttura("090623")
            .build();
        StructureDepartmentSourceDto department = StructureDepartmentSourceDto.builder()
            .id(7L)
            .descrizioneDisciplina("Neurologia")
            .build();
        when(structureClient.findHospitalOverview(null, null)).thenReturn(List.of(hospital));
        when(structureClient.findDepartmentsByStructureCode("090623")).thenReturn(List.of(department));

        List<StructureDepartmentOptionDto> result = structureService.findDepartmentOptions(191L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(7L);
        assertThat(result.get(0).getLabel()).isEqualTo("Neurologia");
    }

    @Test
    void shouldFindAllStructuresFromRemoteClient() {
        ASLDto asl = ASLDto.builder()
            .id(1L)
            .codiceAzienda("ASL-ROMA")
            .denominazioneAzienda("Poliambulatorio Roma")
            .build();
        HospitalDto hospital = HospitalDto.builder()
            .id(2L)
            .codiceStruttura("HOSP-001")
            .struttura("Ospedale Centrale")
            .build();

        when(healthStructureClient.findAsl()).thenReturn(List.of(asl));
        when(healthStructureClient.findHospitals()).thenReturn(List.of(hospital));

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

        when(healthStructureClient.findAsl()).thenReturn(List.of());
        when(healthStructureClient.findHospitals()).thenReturn(List.of(HospitalDto.builder()
            .id(2L)
            .codiceStruttura("HOSP-001")
            .struttura("Ospedale Centrale")
            .build()));

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