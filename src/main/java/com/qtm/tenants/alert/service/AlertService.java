package com.qtm.tenants.alert.service;

import com.qtm.tenants.alert.AlertConfirmationRules;
import com.qtm.tenants.alert.dto.AlertDto;
import com.qtm.tenants.alert.entity.AlertEntity;
import com.qtm.tenants.alert.mapper.AlertMapper;
import com.qtm.tenants.alert.repository.AlertRepository;
import com.qtm.tenants.doctor.entity.DoctorEntity;
import com.qtm.tenants.doctor.repository.DoctorRepository;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import com.qtm.tenants.therapeuticplan.repository.TherapeuticPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service orchestratore CRUD degli alert clinici con validazioni sul medico e sul piano terapeutico associati.
 */
@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final TherapeuticPlanRepository therapeuticPlanRepository;
    private final DoctorRepository doctorRepository;
    private final AlertMapper alertMapper;

    @Transactional(readOnly = true)
    public List<AlertDto> findAll(Long therapeuticPlanId, Long doctorId) {
        return alertRepository.searchByFilters(therapeuticPlanId, doctorId).stream()
                .map(alertMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public AlertDto findById(Long id) {
        return alertRepository.findById(requireId(id))
                .map(alertMapper::toDto)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Alert non trovato"));
    }

    @Transactional
    public AlertDto create(AlertDto dto) {
        AlertDto normalizedDto = normalizeDto(dto);
        TherapeuticPlanEntity therapeuticPlan = resolveTherapeuticPlan(normalizedDto.getTherapeuticPlanId());
        DoctorEntity doctor = resolveDoctor(normalizedDto.getDoctorId());
        validateDoctorMatchesTherapeuticPlan(therapeuticPlan, doctor);

        AlertEntity savedEntity = alertRepository.save(alertMapper.toNewEntity(normalizedDto, therapeuticPlan, doctor));
        return alertMapper.toDto(savedEntity);
    }

    @Transactional
    public AlertDto update(Long id, AlertDto dto) {
        AlertEntity entity = alertRepository.findById(requireId(id))
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Alert non trovato"));

        AlertDto normalizedDto = normalizeDto(dto);
        TherapeuticPlanEntity therapeuticPlan = resolveTherapeuticPlan(normalizedDto.getTherapeuticPlanId());
        DoctorEntity doctor = resolveDoctor(normalizedDto.getDoctorId());
        validateDoctorMatchesTherapeuticPlan(therapeuticPlan, doctor);

        alertMapper.updateEntity(entity, normalizedDto, therapeuticPlan, doctor);
        AlertEntity savedEntity = alertRepository.save(entity);
        return alertMapper.toDto(savedEntity);
    }

    @Transactional
    public void delete(Long id) {
        AlertEntity entity = alertRepository.findById(requireId(id))
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Alert non trovato"));
        alertRepository.delete(entity);
    }

    private AlertDto normalizeDto(AlertDto dto) {
        if (dto == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Payload alert obbligatorio");
        }

        String confirmationSent = normalizeConfirmationSent(dto.getConfirmationSent());
        validateConfirmationCombination(dto.getConfirmationRequired(), confirmationSent);

        if (dto.getDate() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Data alert obbligatoria");
        }

        return AlertDto.builder()
                .id(dto.getId())
                .therapeuticPlanId(requireForeignId(dto.getTherapeuticPlanId(), "Piano terapeutico obbligatorio"))
                .doctorId(requireForeignId(dto.getDoctorId(), "Medico obbligatorio"))
                .date(dto.getDate())
                .subject(normalizeRequiredText(dto.getSubject(), "Oggetto obbligatorio"))
                .confirmationRequired(dto.getConfirmationRequired())
                .confirmationSent(confirmationSent)
                .build();
    }

    private TherapeuticPlanEntity resolveTherapeuticPlan(Long therapeuticPlanId) {
        return therapeuticPlanRepository.findById(therapeuticPlanId)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Piano terapeutico non trovato"));
    }

    private DoctorEntity resolveDoctor(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Medico non trovato"));
    }

    private void validateDoctorMatchesTherapeuticPlan(TherapeuticPlanEntity therapeuticPlan, DoctorEntity doctor) {
        Long therapeuticPlanDoctorId = therapeuticPlan.getDoctor() != null ? therapeuticPlan.getDoctor().getId() : null;
        if (!Objects.equals(therapeuticPlanDoctorId, doctor.getId())) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Il medico dell'alert deve coincidere con il medico associato al piano terapeutico");
        }
    }

    private Long requireId(Long id) {
        if (id == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Id alert obbligatorio");
        }
        return id;
    }

    private Long requireForeignId(Long id, String message) {
        if (id == null) {
            throw new ResponseStatusException(BAD_REQUEST, message);
        }
        return id;
    }

    private String normalizeRequiredText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, message);
        }

        return value.trim();
    }

    private String normalizeConfirmationSent(String value) {
        try {
            return AlertConfirmationRules.normalizeConfirmationSent(value);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, exception.getMessage(), exception);
        }
    }

    private void validateConfirmationCombination(Boolean confirmationRequired, String confirmationSent) {
        try {
            AlertConfirmationRules.validateCombination(confirmationRequired, confirmationSent);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, exception.getMessage(), exception);
        }
    }
}