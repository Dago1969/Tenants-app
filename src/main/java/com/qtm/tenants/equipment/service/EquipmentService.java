package com.qtm.tenants.equipment.service;

import com.qtm.tenants.equipment.EquipmentStatusRules;
import com.qtm.tenants.equipment.dto.EquipmentDTO;
import com.qtm.tenants.equipment.entity.EquipmentEntity;
import com.qtm.tenants.equipment.entity.EquipmentTypeEntity;
import com.qtm.tenants.equipment.mapper.EquipmentMapper;
import com.qtm.tenants.equipment.repository.EquipmentRepository;
import com.qtm.tenants.equipment.repository.EquipmentTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service per la gestione delle attrezzature.
 * Orchestration only, con validazioni di dominio demandate a classi Java pure quando possibile.
 */
@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentTypeRepository equipmentTypeRepository;
    private final EquipmentMapper equipmentMapper;

    @Transactional(readOnly = true)
    public List<EquipmentDTO> findAll(String code, Long equipmentTypeId, String status, String serialNumber) {
        return equipmentMapper.toDtoList(equipmentRepository.searchByFilters(
                normalizeFilter(code),
                equipmentTypeId,
                normalizeStatusFilter(status),
                normalizeFilter(serialNumber)
        ));
    }

    @Transactional(readOnly = true)
    public EquipmentDTO findById(Long id) {
        return equipmentRepository.findById(requireId(id))
                .map(equipmentMapper::toDto)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Attrezzatura non trovata"));
    }

    @Transactional
    public EquipmentDTO create(EquipmentDTO dto) {
        EquipmentDTO normalizedDto = normalizeDto(dto);
        if (equipmentRepository.existsByCode(normalizedDto.getCode())) {
            throw new ResponseStatusException(CONFLICT, "Codice attrezzatura gia presente: " + normalizedDto.getCode());
        }

        EquipmentTypeEntity equipmentType = resolveEquipmentType(normalizedDto.getEquipmentTypeId());
        validateSerialNumberRequirement(normalizedDto, equipmentType);
        EquipmentEntity entity = equipmentMapper.toNewEntity(normalizedDto, equipmentType);
        return equipmentMapper.toDto(equipmentRepository.save(entity));
    }

    @Transactional
    public EquipmentDTO update(Long id, EquipmentDTO dto) {
        Long equipmentId = requireId(id);
        EquipmentEntity entity = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Attrezzatura non trovata"));

        EquipmentDTO normalizedDto = normalizeDto(dto);
        if (equipmentRepository.existsByCodeAndIdNot(normalizedDto.getCode(), equipmentId)) {
            throw new ResponseStatusException(CONFLICT, "Codice attrezzatura gia presente: " + normalizedDto.getCode());
        }

        Long currentEquipmentTypeId = entity.getEquipmentType() != null ? entity.getEquipmentType().getId() : null;
        if (!java.util.Objects.equals(currentEquipmentTypeId, normalizedDto.getEquipmentTypeId())) {
            throw new ResponseStatusException(BAD_REQUEST, "Il tipo attrezzatura non puo essere modificato");
        }

        EquipmentTypeEntity equipmentType = resolveEquipmentType(normalizedDto.getEquipmentTypeId());
        validateSerialNumberRequirement(normalizedDto, equipmentType);
        equipmentMapper.updateEntity(entity, normalizedDto, equipmentType);
        return equipmentMapper.toDto(equipmentRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        Long equipmentId = requireId(id);
        if (!equipmentRepository.existsById(equipmentId)) {
            throw new ResponseStatusException(NOT_FOUND, "Attrezzatura non trovata");
        }
        equipmentRepository.deleteById(equipmentId);
    }

    private EquipmentTypeEntity resolveEquipmentType(Long equipmentTypeId) {
        if (equipmentTypeId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Tipo attrezzatura obbligatorio");
        }

        return equipmentTypeRepository.findById(equipmentTypeId)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Tipo attrezzatura non trovato"));
    }

    private void validateSerialNumberRequirement(EquipmentDTO dto, EquipmentTypeEntity equipmentType) {
        if (equipmentType.isSerialNumberRequired() && normalizeOptionalText(dto.getSerialNumber()) == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Seriale obbligatorio per il tipo attrezzatura selezionato");
        }
    }

    private EquipmentDTO normalizeDto(EquipmentDTO dto) {
        if (dto == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Payload attrezzatura obbligatorio");
        }

        return EquipmentDTO.builder()
                .id(dto.getId())
                .equipmentTypeId(dto.getEquipmentTypeId())
                .code(normalizeRequiredText(dto.getCode(), "Codice attrezzatura obbligatorio"))
                .status(normalizeStatus(dto.getStatus()))
                .serialNumber(normalizeOptionalText(dto.getSerialNumber()))
                .location(normalizeOptionalText(dto.getLocation()))
                .assignedTo(normalizeOptionalText(dto.getAssignedTo()))
                .purchaseDate(dto.getPurchaseDate())
                .lastRevisionDate(dto.getLastRevisionDate())
                .nextRevisionDate(dto.getNextRevisionDate())
                .notes(normalizeOptionalText(dto.getNotes()))
                .primaryJson(normalizeOptionalText(dto.getPrimaryJson()))
                .secondaryJson(normalizeOptionalText(dto.getSecondaryJson()))
                .build();
    }

    private String normalizeFilter(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeStatusFilter(String value) {
        String normalizedValue = normalizeFilter(value);
        if (normalizedValue.isEmpty()) {
            return "";
        }
        return normalizeStatus(normalizedValue);
    }

    private String normalizeStatus(String value) {
        try {
            return EquipmentStatusRules.normalizeStatus(value);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, exception.getMessage());
        }
    }

    private String normalizeRequiredText(String value, String message) {
        String normalizedValue = normalizeOptionalText(value);
        if (normalizedValue == null) {
            throw new ResponseStatusException(BAD_REQUEST, message);
        }
        return normalizedValue.toUpperCase(Locale.ROOT);
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }

        String normalizedValue = value.trim();
        return normalizedValue.isEmpty() ? null : normalizedValue;
    }

    private Long requireId(Long id) {
        if (id == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Identificativo attrezzatura obbligatorio");
        }
        return id;
    }
}