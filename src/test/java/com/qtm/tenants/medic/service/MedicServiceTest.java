package com.qtm.tenants.doctor.service;

import com.qtm.tenants.authorization.FieldAuthorizationRepository;
import com.qtm.tenants.authorization.ModuleRoleAuthorizationRepository;
import com.qtm.tenants.doctor.dto.DoctorDto;
import com.qtm.tenants.doctor.entity.DoctorEntity;
import com.qtm.tenants.doctor.mapper.DoctorMapper;
import com.qtm.tenants.doctor.repository.DoctorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Test unitario del service dottori: verifica CRUD base e mapping dto/entity.
 */
@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private ModuleRoleAuthorizationRepository moduleRoleAuthorizationRepository;

    @Mock
    private FieldAuthorizationRepository fieldAuthorizationRepository;

    private DoctorService doctorService;

    @BeforeEach
    void setUp() {
        doctorService = new DoctorService(
            doctorRepository,
            new DoctorMapper(),
            moduleRoleAuthorizationRepository,
            fieldAuthorizationRepository
        );
    }

    @Test
    void shouldCreateAndReadDoctor() {
        DoctorEntity saved = new DoctorEntity();
        saved.setId(1L);
        saved.setDoctorFlyerId("DOC-000001");
        saved.setFullName("Mario Rossi");
        saved.setEmail("mario.rossi@qtm.local");
        saved.setStructureId(3L);
        saved.setSpecialization("Cardiologia");

        when(doctorRepository.save(any(DoctorEntity.class))).thenReturn(saved);
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(saved));
        when(doctorRepository.findAll()).thenReturn(List.of(saved));

        DoctorDto toCreate = new DoctorDto();
        toCreate.setFullName("Mario Rossi");
        toCreate.setEmail("mario.rossi@qtm.local");
        toCreate.setStructureId(3L);
        toCreate.setSpecialization("Cardiologia");

        DoctorDto created = doctorService.create(toCreate);
        DoctorDto loaded = doctorService.findById(1L);

        assertThat(created.getId()).isEqualTo(1L);
        assertThat(created.getDoctorFlyerId()).isEqualTo("DOC-000001");
        assertThat(loaded.getSpecialization()).isEqualTo("Cardiologia");
        assertThat(doctorService.findAll()).hasSize(1);
    }
}
