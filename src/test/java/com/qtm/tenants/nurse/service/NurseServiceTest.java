package com.qtm.tenants.nurse.service;

import com.qtm.tenants.authorization.FieldAuthorizationRepository;
import com.qtm.tenants.authorization.ModuleRoleAuthorizationRepository;
import com.qtm.tenants.nurse.dto.NurseDto;
import com.qtm.tenants.nurse.entity.NurseEntity;
import com.qtm.tenants.nurse.mapper.NurseMapper;
import com.qtm.tenants.nurse.repository.NurseRepository;
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
 * Test unitario del service infermieri: verifica CRUD base e mapping dto/entity.
 */
@ExtendWith(MockitoExtension.class)
class NurseServiceTest {

    @Mock
    private NurseRepository nurseRepository;

    @Mock
    private ModuleRoleAuthorizationRepository moduleRoleAuthorizationRepository;

    @Mock
    private FieldAuthorizationRepository fieldAuthorizationRepository;

    private NurseService nurseService;

    @BeforeEach
    void setUp() {
        nurseService = new NurseService(
                nurseRepository,
                new NurseMapper(),
                moduleRoleAuthorizationRepository,
                fieldAuthorizationRepository
        );
    }

    @Test
    void shouldCreateAndReadNurse() {
        NurseEntity saved = new NurseEntity();
        saved.setId(1L);
        saved.setNurseProjectId("QTM-NUR-000001");
        saved.setFullName("Sara Neri");
        saved.setEmail("sara.neri@qtm.local");
        saved.setReferenceProvider("Provider Nord");
        saved.setEnabled(Boolean.TRUE);

        when(nurseRepository.save(any(NurseEntity.class))).thenReturn(saved);
        when(nurseRepository.findById(1L)).thenReturn(Optional.of(saved));
        when(nurseRepository.findAll()).thenReturn(List.of(saved));

        NurseDto toCreate = new NurseDto();
        toCreate.setFullName("Sara Neri");
        toCreate.setEmail("sara.neri@qtm.local");
        toCreate.setReferenceProvider("Provider Nord");
        toCreate.setEnabled(Boolean.TRUE);

        NurseDto created = nurseService.create(toCreate);
        NurseDto loaded = nurseService.findById(1L);

        assertThat(created.getId()).isEqualTo(1L);
        assertThat(created.getNurseProjectId()).isEqualTo("QTM-NUR-000001");
        assertThat(loaded.getReferenceProvider()).isEqualTo("Provider Nord");
        assertThat(nurseService.findAll()).hasSize(1);
    }
}
