package com.qtm.tenants.equipment.service;

import com.qtm.tenants.equipment.dto.EquipmentTypeDTO;
import com.qtm.tenants.equipment.entity.EquipmentTypeEntity;
import com.qtm.tenants.equipment.mapper.EquipmentTypeMapper;
import com.qtm.tenants.equipment.repository.EquipmentTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Objects;

/**
 * Service per la gestione dei tipi di equipaggiamento.
 * Orchestration only, nessuna logica applicativa.
 */
@Service
@RequiredArgsConstructor
public class EquipmentTypeService {
    private final EquipmentTypeRepository repository;
    private final EquipmentTypeMapper mapper;

    public List<EquipmentTypeDTO> findAll(String code, String name, String status) {
        return mapper.toDtoList(repository.findByCodeContainingIgnoreCaseAndNameContainingIgnoreCaseAndStatusContainingIgnoreCase(
                normalizeFilter(code),
                normalizeFilter(name),
                normalizeFilter(status)
        ));
    }

    public EquipmentTypeDTO findByCode(String code) {
        return repository.findByCode(code)
                .map(mapper::toDto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "equipmentType.notFound"));
    }

    @Transactional
    public EquipmentTypeDTO create(EquipmentTypeDTO dto) {
        if (repository.existsByCode(dto.getCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "equipmentType.code.duplicate");
        }
        EquipmentTypeEntity entity = mapper.toEntity(dto);
        EquipmentTypeEntity savedEntity = repository.save(Objects.requireNonNull(entity, "equipmentTypeEntity"));
        return mapper.toDto(savedEntity);
    }

    @Transactional
    public EquipmentTypeDTO update(Long id, EquipmentTypeDTO dto) {
        Long entityId = Objects.requireNonNull(id, "equipmentTypeId");
        EquipmentTypeEntity entity = repository.findById(entityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "equipmentType.notFound"));
        if (repository.existsByCodeAndIdNot(dto.getCode(), entityId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "equipmentType.code.duplicate");
        }
        entity.setCode(dto.getCode());
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setUse(dto.getUse());
        entity.setCost(dto.getCost());
        entity.setSupplier(dto.getSupplier());
        entity.setSerialNumberRequired(dto.isSerialNumberRequired());
        entity.setPrincipalJsonPresent(dto.isPrincipalJsonPresent());
        entity.setPrincipalJsonPath(dto.getPrincipalJsonPath());
        entity.setSecondaryJsonPresent(dto.isSecondaryJsonPresent());
        entity.setSecondaryJsonPath(dto.getSecondaryJsonPath());
        entity.setPurchaseDate(dto.getPurchaseDate());
        entity.setStatus(dto.getStatus());
        return mapper.toDto(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        Long entityId = Objects.requireNonNull(id, "equipmentTypeId");
        if (!repository.existsById(entityId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "equipmentType.notFound");
        }
        repository.deleteById(entityId);
    }

    @Transactional
    public EquipmentTypeDTO updateByCode(String code, EquipmentTypeDTO dto) {
        EquipmentTypeEntity entity = repository.findByCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "equipmentType.notFound"));
        return update(entity.getId(), dto);
    }

    @Transactional
    public void deleteByCode(String code) {
        EquipmentTypeEntity entity = repository.findByCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "equipmentType.notFound"));
        repository.deleteById(Objects.requireNonNull(entity.getId(), "equipmentTypeId"));
    }

    private String normalizeFilter(String value) {
        return value == null ? "" : value.trim();
    }
}
