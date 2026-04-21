package com.qtm.tenants.therapeuticplan.service;

import com.qtm.commonlib.dto.PatientDto;
import com.qtm.tenants.patient.service.DashboardPatientClient;
import com.qtm.tenants.structure.entity.StructureEntity;
import com.qtm.tenants.therapeuticplan.TherapeuticPlanActivityBookingRules;
import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanActivityBookingDto;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanActivityBookingEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import com.qtm.tenants.therapeuticplan.mapper.TherapeuticPlanActivityBookingMapper;
import com.qtm.tenants.therapeuticplan.repository.TherapeuticPlanActivityBookingRepository;
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
 * Service orchestratore per registrare le prenotazioni attivita del piano terapeutico con centro e paziente preimpostati.
 */
@Service
@RequiredArgsConstructor
public class TherapeuticPlanActivityBookingService {

    private final TherapeuticPlanActivityBookingRepository activityBookingRepository;
    private final DashboardPatientClient dashboardPatientClient;
    private final TherapeuticPlanRepository therapeuticPlanRepository;
    private final TherapeuticPlanActivityBookingMapper activityBookingMapper;

    @Transactional(readOnly = true)
    public List<TherapeuticPlanActivityBookingDto> findAll(Long therapeuticPlanId) {
    List<TherapeuticPlanActivityBookingEntity> bookings = activityBookingRepository.findByTherapeuticPlanId(
        requireId(therapeuticPlanId, "Piano terapeutico obbligatorio")
    );
    Map<Long, PatientDto> patientsById = loadPatientsByIds(bookings.stream()
        .map(TherapeuticPlanActivityBookingEntity::getPatientId)
        .filter(Objects::nonNull)
        .collect(Collectors.toSet()));

    return bookings
                .stream()
        .map(entity -> activityBookingMapper.toDto(entity, buildPatientDisplayName(patientsById.get(entity.getPatientId()))))
                .toList();
    }

    @Transactional
    public TherapeuticPlanActivityBookingDto create(TherapeuticPlanActivityBookingDto dto) {
        TherapeuticPlanActivityBookingDto normalizedDto = normalizeDto(dto);
        TherapeuticPlanEntity therapeuticPlan = therapeuticPlanRepository.findById(normalizedDto.getTherapeuticPlanId())
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Piano terapeutico non trovato"));

        Long patientId = therapeuticPlan.getPatientId();
        if (patientId == null) {
            throw new ResponseStatusException(BAD_REQUEST,
                "Il piano terapeutico deve avere un paziente associato per registrare la prenotazione attivita");
        }

        PatientDto patient = resolvePatient(patientId);

        StructureEntity structure = therapeuticPlan.getStructure();
        if (structure == null || structure.getId() == null) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Il piano terapeutico deve avere un centro medico associato per registrare la prenotazione attivita");
        }

        TherapeuticPlanActivityBookingEntity savedEntity = activityBookingRepository.save(
            activityBookingMapper.toNewEntity(
                TherapeuticPlanActivityBookingDto.builder()
                    .id(normalizedDto.getId())
                    .therapeuticPlanId(normalizedDto.getTherapeuticPlanId())
                    .patientId(patient.getId())
                    .bookingDate(normalizedDto.getBookingDate())
                    .visitType(normalizedDto.getVisitType())
                    .protocolPlanned(normalizedDto.getProtocolPlanned())
                    .build(),
                therapeuticPlan,
                structure
            )
        );
        return activityBookingMapper.toDto(savedEntity, buildPatientDisplayName(patient));
    }

    private TherapeuticPlanActivityBookingDto normalizeDto(TherapeuticPlanActivityBookingDto dto) {
        if (dto == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Payload prenotazione attivita obbligatorio");
        }

        Long therapeuticPlanId = requireId(dto.getTherapeuticPlanId(), "Piano terapeutico obbligatorio");
        LocalDate bookingDate = dto.getBookingDate();
        if (bookingDate == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Data visita obbligatoria");
        }

        Boolean protocolPlanned = dto.getProtocolPlanned();
        if (protocolPlanned == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Indicazione protocollo obbligatoria");
        }

        String visitType;
        try {
            visitType = TherapeuticPlanActivityBookingRules.normalizeVisitType(dto.getVisitType());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, exception.getMessage(), exception);
        }

        return TherapeuticPlanActivityBookingDto.builder()
                .id(dto.getId())
                .therapeuticPlanId(therapeuticPlanId)
                .patientId(dto.getPatientId())
                .bookingDate(bookingDate)
                .visitType(visitType)
                .protocolPlanned(protocolPlanned)
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

    private Long requireId(Long id, String message) {
        if (id == null) {
            throw new ResponseStatusException(BAD_REQUEST, message);
        }
        return id;
    }
}