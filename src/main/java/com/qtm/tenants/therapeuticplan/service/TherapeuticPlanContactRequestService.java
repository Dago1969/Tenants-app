package com.qtm.tenants.therapeuticplan.service;

import com.qtm.commonlib.dto.PatientDto;
import com.qtm.tenants.patient.service.DashboardPatientClient;
import com.qtm.tenants.structure.entity.StructureEntity;
import com.qtm.tenants.therapeuticplan.TherapeuticPlanContactRequestRules;
import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanContactRequestDto;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanContactRequestEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import com.qtm.tenants.therapeuticplan.mapper.TherapeuticPlanContactRequestMapper;
import com.qtm.tenants.therapeuticplan.repository.TherapeuticPlanContactRequestRepository;
import com.qtm.tenants.therapeuticplan.repository.TherapeuticPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service orchestratore per consultare e registrare le richieste contatto del piano terapeutico.
 */
@Service
@RequiredArgsConstructor
public class TherapeuticPlanContactRequestService {

    private final TherapeuticPlanContactRequestRepository contactRequestRepository;
    private final DashboardPatientClient dashboardPatientClient;
    private final TherapeuticPlanRepository therapeuticPlanRepository;
    private final TherapeuticPlanContactRequestMapper contactRequestMapper;

    @Transactional(readOnly = true)
    public List<TherapeuticPlanContactRequestDto> findAll(Long therapeuticPlanId) {
        List<TherapeuticPlanContactRequestEntity> requests = contactRequestRepository.findByTherapeuticPlanId(
                requireId(therapeuticPlanId, "Piano terapeutico obbligatorio")
        );
        Map<Long, PatientDto> patientsById = loadPatientsByIds(requests.stream()
                .map(TherapeuticPlanContactRequestEntity::getPatientId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet()));

        return requests.stream()
                .map(entity -> contactRequestMapper.toDto(
                        entity,
                        buildPatientDisplayName(patientsById.get(entity.getPatientId()))
                ))
                .toList();
    }

    @Transactional
    public TherapeuticPlanContactRequestDto create(TherapeuticPlanContactRequestDto dto) {
        TherapeuticPlanContactRequestDto normalizedDto = normalizeDto(dto);
        TherapeuticPlanEntity therapeuticPlan = therapeuticPlanRepository.findById(normalizedDto.getTherapeuticPlanId())
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Piano terapeutico non trovato"));

        Long patientId = therapeuticPlan.getPatientId();
        if (patientId == null) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Il piano terapeutico deve avere un paziente associato per registrare la richiesta contatto");
        }

        PatientDto patient = resolvePatient(patientId);

        StructureEntity structure = therapeuticPlan.getStructure();
        if (structure == null || structure.getId() == null) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Il piano terapeutico deve avere un centro medico associato per registrare la richiesta contatto");
        }

        TherapeuticPlanContactRequestEntity savedEntity = contactRequestRepository.save(
                contactRequestMapper.toNewEntity(
                        TherapeuticPlanContactRequestDto.builder()
                                .id(normalizedDto.getId())
                                .therapeuticPlanId(normalizedDto.getTherapeuticPlanId())
                                .patientId(patient.getId())
                                .requestDate(normalizedDto.getRequestDate())
                                .requestType(normalizedDto.getRequestType())
                                .outpatientClinic(normalizedDto.getOutpatientClinic())
                                .status(normalizedDto.getStatus())
                                .build(),
                        therapeuticPlan,
                        structure
                )
        );
        return contactRequestMapper.toDto(savedEntity, buildPatientDisplayName(patient));
    }

    private TherapeuticPlanContactRequestDto normalizeDto(TherapeuticPlanContactRequestDto dto) {
        if (dto == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Payload richiesta contatto obbligatorio");
        }

        Long therapeuticPlanId = requireId(dto.getTherapeuticPlanId(), "Piano terapeutico obbligatorio");
        LocalDate requestDate = dto.getRequestDate();
        if (requestDate == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Data richiesta obbligatoria");
        }

        String outpatientClinic = normalizeRequiredText(dto.getOutpatientClinic(), "Ambulatorio obbligatorio");

        String requestType;
        try {
            requestType = TherapeuticPlanContactRequestRules.normalizeRequestType(dto.getRequestType());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, exception.getMessage(), exception);
        }

        String status;
        try {
            status = TherapeuticPlanContactRequestRules.normalizeStatus(dto.getStatus());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, exception.getMessage(), exception);
        }

        return TherapeuticPlanContactRequestDto.builder()
                .id(dto.getId())
                .therapeuticPlanId(therapeuticPlanId)
                .patientId(dto.getPatientId())
                .requestDate(requestDate)
                .requestType(requestType)
                .outpatientClinic(outpatientClinic)
                .status(status)
                .build();
    }

    private PatientDto resolvePatient(Long patientId) {
        try {
            PatientDto patient = dashboardPatientClient.findById(patientId);
            if (patient == null) {
                throw new ResponseStatusException(BAD_REQUEST, "Paziente del piano terapeutico non trovato");
            }
            return patient;
        } catch (ResponseStatusException exception) {
            if (exception.getStatusCode() == NOT_FOUND) {
                throw new ResponseStatusException(BAD_REQUEST, "Paziente del piano terapeutico non trovato", exception);
            }
            throw exception;
        }
    }

    private Map<Long, PatientDto> loadPatientsByIds(Set<Long> patientIds) {
        if (patientIds.isEmpty()) {
            return Map.of();
        }

        return Optional.ofNullable(dashboardPatientClient.findAll())
                .orElseGet(List::of)
                .stream()
                .filter(Objects::nonNull)
                .filter(patient -> patient.getId() != null)
                .filter(patient -> patientIds.contains(patient.getId()))
                .collect(Collectors.toMap(PatientDto::getId, Function.identity(), (left, right) -> left));
    }

    private String buildPatientDisplayName(PatientDto patient) {
        if (patient == null) {
            return null;
        }

        String firstName = patient.getFirstName() == null ? "" : patient.getFirstName().trim();
        String lastName = patient.getLastName() == null ? "" : patient.getLastName().trim();
        String fullName = (firstName + " " + lastName).trim();
        return fullName.isBlank() ? null : fullName;
    }

    private String normalizeRequiredText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, message);
        }
        return value.trim();
    }

    private Long requireId(Long id, String message) {
        if (id == null) {
            throw new ResponseStatusException(BAD_REQUEST, message);
        }
        return id;
    }
}