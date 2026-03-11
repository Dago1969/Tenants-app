package com.qtm.tenants.patient.service;

import com.qtm.tenants.authorization.FieldAuthorizationRepository;
import com.qtm.tenants.authorization.ModuleRoleAuthorizationRepository;
import com.qtm.commonlib.dto.PatientDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Test del service pazienti: verifica CRUD di base con mapping dto/entity.
 */
@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private DashboardPatientClient dashboardPatientClient;

    @Mock
    private ModuleRoleAuthorizationRepository moduleRoleAuthorizationRepository;

    @Mock
    private FieldAuthorizationRepository fieldAuthorizationRepository;

    private PatientService patientService;

    @BeforeEach
    void setUp() {
        patientService = new PatientService(
                dashboardPatientClient,
                moduleRoleAuthorizationRepository,
                fieldAuthorizationRepository
        );
    }

    @Test
    void shouldCreateAndReadPatient() {
        PatientDto toCreate = new PatientDto();
        toCreate.setId(1L);
        toCreate.setFirstName("Mario");
        toCreate.setLastName("Rossi");
        toCreate.setFiscalCode("RSSMRA80A01H501U");
        toCreate.setStructureId(3L);

        when(dashboardPatientClient.create(toCreate)).thenReturn(toCreate);
        when(dashboardPatientClient.findById(1L)).thenReturn(toCreate);
        when(dashboardPatientClient.findAll()).thenReturn(List.of(toCreate));

        PatientDto created = patientService.create(toCreate);
        PatientDto loaded = patientService.findById(1L);

        assertThat(created.getId()).isEqualTo(1L);
        assertThat(loaded.getFiscalCode()).isEqualTo("RSSMRA80A01H501U");
        assertThat(patientService.findAll()).hasSize(1);
    }
}