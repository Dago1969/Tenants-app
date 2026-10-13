package com.qtm.tenants.patient.service;

import com.qtm.tenants.authorization.FieldAuthorizationRepository;
import com.qtm.tenants.authorization.ModuleRoleAuthorizationRepository;
import com.qtm.commonlib.dto.PatientDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
        toCreate.setDataProcessingConsent(true);
        toCreate.setDataProcessingConsentDateTime(LocalDateTime.of(2026, 10, 12, 12, 0));

        when(dashboardPatientClient.create(toCreate)).thenReturn(toCreate);
        when(dashboardPatientClient.findById(1L)).thenReturn(toCreate);
        when(dashboardPatientClient.findAll()).thenReturn(List.of(toCreate));

        PatientDto created = patientService.create(toCreate);
        PatientDto loaded = patientService.findById(1L);

        assertThat(created.getId()).isEqualTo(1L);
        assertThat(loaded.getFiscalCode()).isEqualTo("RSSMRA80A01H501U");
        assertThat(patientService.findAll()).hasSize(1);
    }

    @Test
    void shouldUpdatePatientWhenRevokingPreviouslyGrantedConsent() {
        LocalDateTime consentDateTime = LocalDateTime.of(2026, 10, 12, 12, 0);
        PatientDto current = new PatientDto();
        current.setId(1L);
        current.setFiscalCode("RSSMRA80A01H501U");
        current.setDataProcessingConsent(true);
        current.setDataProcessingConsentDateTime(consentDateTime);

        PatientDto revoked = new PatientDto();
        revoked.setId(1L);
        revoked.setFiscalCode("RSSMRA80A01H501U");
        revoked.setDataProcessingConsent(false);
        revoked.setDataProcessingConsentDateTime(consentDateTime);
        revoked.setDataProcessingConsentRevocationDateTime(LocalDateTime.of(2026, 10, 12, 12, 30));
        revoked.setDataProcessingConsentRevocationReason("Richiesta del paziente");

        when(dashboardPatientClient.findById(1L)).thenReturn(current);
        when(dashboardPatientClient.update(1L, revoked)).thenReturn(revoked);

        PatientDto updated = patientService.update(1L, revoked);

        assertThat(updated.getDataProcessingConsent()).isFalse();
        assertThat(updated.getDataProcessingConsentRevocationDateTime())
                .isEqualTo(LocalDateTime.of(2026, 10, 12, 12, 30));
        assertThat(updated.getDataProcessingConsentRevocationReason()).isEqualTo("Richiesta del paziente");
    }

    @Test
    void shouldRejectRevocationWhenConsentWasNeverGranted() {
        PatientDto current = new PatientDto();
        current.setId(1L);
        current.setFiscalCode("RSSMRA80A01H501U");
        current.setDataProcessingConsent(false);

        PatientDto revoked = new PatientDto();
        revoked.setId(1L);
        revoked.setFiscalCode("RSSMRA80A01H501U");
        revoked.setDataProcessingConsent(false);
        revoked.setDataProcessingConsentRevocationDateTime(LocalDateTime.of(2026, 10, 12, 12, 30));

        when(dashboardPatientClient.findById(1L)).thenReturn(current);

        assertThatThrownBy(() -> patientService.update(1L, revoked))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                .hasMessageContaining("Il consenso deve essere acquisito");
    }
}