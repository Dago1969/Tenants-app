package com.qtm.tenants.equipment.service;

import com.qtm.tenants.equipment.dto.EquipmentTypeDTO;
import com.qtm.tenants.equipment.entity.EquipmentTypeEntity;
import com.qtm.tenants.equipment.mapper.EquipmentTypeMapper;
import com.qtm.tenants.equipment.repository.EquipmentTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Test del service equipment type: verifica default dello status e ricerca senza esclusione dei record con status nullo.
 */
@ExtendWith(MockitoExtension.class)
class EquipmentTypeServiceTest {

    @Mock
    private EquipmentTypeRepository equipmentTypeRepository;

    private EquipmentTypeService equipmentTypeService;

    @BeforeEach
    void setUp() {
        equipmentTypeService = new EquipmentTypeService(equipmentTypeRepository, new EquipmentTypeMapper());
    }

    @Test
    void shouldDefaultStatusToAttivoWhenCreatingWithoutStatus() {
        EquipmentTypeDTO dto = EquipmentTypeDTO.builder()
                .code("EQ-001")
                .name("Pompa")
                .build();

        when(equipmentTypeRepository.existsByCode("EQ-001")).thenReturn(false);
        when(equipmentTypeRepository.save(any(EquipmentTypeEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EquipmentTypeDTO created = equipmentTypeService.create(dto);

        ArgumentCaptor<EquipmentTypeEntity> entityCaptor = ArgumentCaptor.forClass(EquipmentTypeEntity.class);
        verify(equipmentTypeRepository).save(entityCaptor.capture());
        assertThat(entityCaptor.getValue().getStatus()).isEqualTo("attivo");
        assertThat(created.getStatus()).isEqualTo("attivo");
    }

    @Test
    void shouldSearchWithoutFilteringOutNullStatusWhenStatusFilterIsBlank() {
        EquipmentTypeEntity entity = EquipmentTypeEntity.builder()
                .id(1L)
                .code("EQ-001")
                .name("Pompa")
                .status(null)
                .build();

        when(equipmentTypeRepository.searchByFilters(eq(""), eq(""), eq(""))).thenReturn(List.of(entity));

        List<EquipmentTypeDTO> results = equipmentTypeService.findAll(null, null, null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getCode()).isEqualTo("EQ-001");
        assertThat(results.get(0).getStatus()).isNull();
    }
}