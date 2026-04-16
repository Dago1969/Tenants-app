package com.qtm.tenants.equipment.service;

import com.qtm.tenants.equipment.dto.EquipmentDTO;
import com.qtm.tenants.equipment.entity.EquipmentEntity;
import com.qtm.tenants.equipment.entity.EquipmentTypeEntity;
import com.qtm.tenants.equipment.mapper.EquipmentMapper;
import com.qtm.tenants.equipment.repository.EquipmentRepository;
import com.qtm.tenants.equipment.repository.EquipmentTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Test del service equipment: verifica default dello status e validazione del tipo attrezzatura richiesto.
 */
@ExtendWith(MockitoExtension.class)
class EquipmentServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private EquipmentTypeRepository equipmentTypeRepository;

    private EquipmentService equipmentService;

    @BeforeEach
    void setUp() {
        equipmentService = new EquipmentService(equipmentRepository, equipmentTypeRepository, new EquipmentMapper());
    }

    @Test
    void shouldDefaultStatusToInMagazzinoWhenCreatingWithoutStatus() {
        EquipmentTypeEntity equipmentType = EquipmentTypeEntity.builder()
                .id(10L)
                .code("POMPA")
                .name("Pompa")
                .build();

        EquipmentDTO dto = EquipmentDTO.builder()
                .equipmentTypeId(10L)
                .code("eq-001")
                .build();

        when(equipmentRepository.existsByCode("EQ-001")).thenReturn(false);
        when(equipmentTypeRepository.findById(10L)).thenReturn(Optional.of(equipmentType));
        when(equipmentRepository.save(any(EquipmentEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EquipmentDTO created = equipmentService.create(dto);

        ArgumentCaptor<EquipmentEntity> entityCaptor = ArgumentCaptor.forClass(EquipmentEntity.class);
        verify(equipmentRepository).save(entityCaptor.capture());
        assertThat(entityCaptor.getValue().getStatus()).isEqualTo("in_magazzino");
        assertThat(entityCaptor.getValue().getCode()).isEqualTo("EQ-001");
        assertThat(created.getStatus()).isEqualTo("in_magazzino");
        assertThat(created.getEquipmentTypeId()).isEqualTo(10L);
    }

    @Test
    void shouldRejectCreateWhenEquipmentTypeIsMissing() {
        EquipmentDTO dto = EquipmentDTO.builder()
                .code("EQ-001")
                .build();

        assertThatThrownBy(() -> equipmentService.create(dto))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Tipo attrezzatura obbligatorio");
    }

        @Test
        void shouldRejectUpdateWhenEquipmentTypeChanges() {
        EquipmentTypeEntity initialType = EquipmentTypeEntity.builder()
            .id(10L)
            .code("POMPA")
            .name("Pompa")
            .build();
        EquipmentEntity entity = EquipmentEntity.builder()
            .id(5L)
            .equipmentType(initialType)
            .code("EQ-001")
            .status("in_magazzino")
            .build();

        EquipmentDTO dto = EquipmentDTO.builder()
            .equipmentTypeId(20L)
            .code("EQ-001")
            .status("assegnato")
            .build();

        when(equipmentRepository.findById(5L)).thenReturn(Optional.of(entity));
        when(equipmentRepository.existsByCodeAndIdNot("EQ-001", 5L)).thenReturn(false);

        assertThatThrownBy(() -> equipmentService.update(5L, dto))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Il tipo attrezzatura non puo essere modificato");

        verify(equipmentRepository, never()).save(any(EquipmentEntity.class));
        }
}