package com.qtm.tenants.medic.service;

import com.qtm.tenants.authorization.FieldAuthorizationRepository;
import com.qtm.tenants.authorization.ModuleRoleAuthorizationRepository;
import com.qtm.tenants.medic.dto.MedicDto;
import com.qtm.tenants.medic.entity.MedicEntity;
import com.qtm.tenants.medic.mapper.MedicMapper;
import com.qtm.tenants.medic.repository.MedicRepository;
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
 * Test unitario del service medici: verifica CRUD base e mapping dto/entity.
 */
@ExtendWith(MockitoExtension.class)
class MedicServiceTest {

    @Mock
    private MedicRepository medicRepository;

    @Mock
    private ModuleRoleAuthorizationRepository moduleRoleAuthorizationRepository;

    @Mock
    private FieldAuthorizationRepository fieldAuthorizationRepository;

    private MedicService medicService;

    @BeforeEach
    void setUp() {
        medicService = new MedicService(
                medicRepository,
                new MedicMapper(),
                moduleRoleAuthorizationRepository,
                fieldAuthorizationRepository
        );
    }

    @Test
    void shouldCreateAndReadMedic() {
        MedicEntity saved = new MedicEntity();
        saved.setId(1L);
        saved.setDoctorFlyerId("DOC-000001");
        saved.setFullName("Mario Rossi");
        saved.setEmail("mario.rossi@qtm.local");
        saved.setStructureId(3L);
        saved.setSpecialization("Cardiologia");

        when(medicRepository.save(any(MedicEntity.class))).thenReturn(saved);
        when(medicRepository.findById(1L)).thenReturn(Optional.of(saved));
        when(medicRepository.findAll()).thenReturn(List.of(saved));

        MedicDto toCreate = new MedicDto();
        toCreate.setFullName("Mario Rossi");
        toCreate.setEmail("mario.rossi@qtm.local");
        toCreate.setStructureId(3L);
        toCreate.setSpecialization("Cardiologia");

        MedicDto created = medicService.create(toCreate);
        MedicDto loaded = medicService.findById(1L);

        assertThat(created.getId()).isEqualTo(1L);
        assertThat(created.getDoctorFlyerId()).isEqualTo("DOC-000001");
        assertThat(loaded.getSpecialization()).isEqualTo("Cardiologia");
        assertThat(medicService.findAll()).hasSize(1);
    }
}
