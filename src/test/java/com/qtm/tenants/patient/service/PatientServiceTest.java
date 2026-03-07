package com.qtm.tenants.patient.service;

import com.qtm.tenants.authorization.FieldAuthorizationRepository;
import com.qtm.tenants.authorization.ModuleRoleAuthorizationRepository;
import com.qtm.tenants.patient.dto.PatientDto;
import com.qtm.tenants.patient.entity.PatientEntity;
import com.qtm.tenants.patient.mapper.PatientMapper;
import com.qtm.tenants.patient.repository.PatientRepository;
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
 * Test del service pazienti: verifica CRUD di base con mapping dto/entity.
 */
@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private ModuleRoleAuthorizationRepository moduleRoleAuthorizationRepository;

    @Mock
    private FieldAuthorizationRepository fieldAuthorizationRepository;

    private PatientService patientService;

    @BeforeEach
    void setUp() {
        patientService = new PatientService(
                patientRepository,
                new PatientMapper(),
                moduleRoleAuthorizationRepository,
                fieldAuthorizationRepository
        );
    }

    @Test
    void shouldCreateAndReadPatient() {
        PatientEntity saved = new PatientEntity();
        saved.setId(1L);
        saved.setFirstName("Mario");
        saved.setLastName("Rossi");
        saved.setFiscalCode("RSSMRA80A01H501U");
        saved.setStructureId(3L);

        when(patientRepository.save(any(PatientEntity.class))).thenReturn(saved);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(saved));
        when(patientRepository.findAll()).thenReturn(List.of(saved));

        PatientDto toCreate = new PatientDto();
        toCreate.setFirstName("Mario");
        toCreate.setLastName("Rossi");
        toCreate.setFiscalCode("RSSMRA80A01H501U");
        toCreate.setStructureId(3L);

        PatientDto created = patientService.create(toCreate);
        PatientDto loaded = patientService.findById(1L);

        assertThat(created.getId()).isEqualTo(1L);
        assertThat(loaded.getFiscalCode()).isEqualTo("RSSMRA80A01H501U");
        assertThat(patientService.findAll()).hasSize(1);
    }
}