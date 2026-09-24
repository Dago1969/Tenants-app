package com.qtm.tenants.therapeuticplan.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qtm.tenants.project.service.DashboardProjectClient;
import com.qtm.tenants.structure.repository.StructureRepository;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanVisitEntity;
import com.qtm.tenants.therapeuticplan.repository.TherapeuticPlanVisitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;

/**
 * Test unitario parametrizzato per la verifica del motore di calcolo
 * del piano visite/accessi domiciliari in base al tipo e alla data dimissione.
 */
@ExtendWith(MockitoExtension.class)
class TherapeuticPlanScheduleEngineServiceTest {

    @Mock
    private TherapeuticPlanVisitRepository visitRepository;

    @Mock
    private DashboardProjectClient dashboardProjectClient;

    @Mock
    private StructureRepository structureRepository;

    private TherapeuticPlanScheduleEngineService engineService;

    @Captor
    private ArgumentCaptor<List<TherapeuticPlanVisitEntity>> visitsCaptor;

    @BeforeEach
    void setUp() {
        engineService = new TherapeuticPlanScheduleEngineService(
                visitRepository,
                dashboardProjectClient,
                structureRepository,
                new ObjectMapper()
        );
    }

    /**
     * Fornisce i casi di test per i diversi tipi di dimissione (NAIVE, SWITCH, SONDINO) e il numero minimo atteso di visite generate.
     */
    static Stream<Arguments> provideDischargeScenarios() {
        return Stream.of(
                Arguments.of("NAIVE", LocalDate.of(2026, 10, 1), 12),
                Arguments.of("SWITCH", LocalDate.of(2026, 10, 1), 8),
                Arguments.of("SONDINO", LocalDate.of(2026, 10, 1), 8)
        );
    }

    /**
     * Test unitario parametrizzato che verifica la corretta generazione automatica delle visite e l'assegnazione dello stato PROPOSTO_AUTOMATICO.
     */
    @ParameterizedTest
    @MethodSource("provideDischargeScenarios")
    void testGenerateAutomaticVisits(String dischargeType, LocalDate dischargeDate, int minExpectedVisits) {
        TherapeuticPlanEntity plan = TherapeuticPlanEntity.builder()
                .id(100L)
                .projectCode("TEST_PROJ")
                .dischargeDate(dischargeDate)
                .dischargeType(dischargeType)
                .endDate(dischargeDate.plusMonths(12))
                .build();

        engineService.generateAutomaticVisits(plan);

        verify(visitRepository).deleteByTherapeuticPlanIdAndStatus(100L, TherapeuticPlanScheduleEngineService.STATUS_PROPOSTO_AUTOMATICO);
        verify(visitRepository).saveAll(visitsCaptor.capture());

        List<TherapeuticPlanVisitEntity> savedVisits = visitsCaptor.getValue();
        assertNotNull(savedVisits);
        assertTrue(savedVisits.size() >= minExpectedVisits,
                "Ci si aspettava almeno " + minExpectedVisits + " visite per tipo " + dischargeType + ", trovate: " + savedVisits.size());

        for (TherapeuticPlanVisitEntity visit : savedVisits) {
            assertEquals(100L, visit.getTherapeuticPlanId());
            assertEquals(TherapeuticPlanScheduleEngineService.STATUS_PROPOSTO_AUTOMATICO, visit.getStatus());
        }
    }
}
