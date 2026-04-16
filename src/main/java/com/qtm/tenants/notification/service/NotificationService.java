package com.qtm.tenants.notification.service;

import com.qtm.tenants.notification.NotificationConfirmationRules;
import com.qtm.tenants.notification.dto.NotificationDto;
import com.qtm.tenants.notification.entity.NotificationEntity;
import com.qtm.tenants.notification.mapper.NotificationMapper;
import com.qtm.tenants.notification.repository.NotificationRepository;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import com.qtm.tenants.therapeuticplan.repository.TherapeuticPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service orchestratore CRUD delle notifiche di riepilogo con validazioni su piano terapeutico e conferma medica.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final TherapeuticPlanRepository therapeuticPlanRepository;
    private final NotificationMapper notificationMapper;

    @Transactional(readOnly = true)
    public List<NotificationDto> findAll(Long therapeuticPlanId) {
        return notificationRepository.searchByTherapeuticPlanId(therapeuticPlanId).stream()
                .map(notificationMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public NotificationDto findById(Long id) {
        return notificationRepository.findById(requireId(id))
                .map(notificationMapper::toDto)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Notifica non trovata"));
    }

    @Transactional
    public NotificationDto create(NotificationDto dto, String currentOperator) {
        NotificationDto normalizedDto = normalizeDto(dto, currentOperator);
        TherapeuticPlanEntity therapeuticPlan = resolveTherapeuticPlan(normalizedDto.getTherapeuticPlanId());
        NotificationDto persistedDto = enrichDoctorConfirmation(normalizedDto, therapeuticPlan);

        NotificationEntity savedEntity = notificationRepository.save(
                notificationMapper.toNewEntity(persistedDto, therapeuticPlan)
        );
        return notificationMapper.toDto(savedEntity);
    }

    @Transactional
    public NotificationDto update(Long id, NotificationDto dto) {
        NotificationEntity entity = notificationRepository.findById(requireId(id))
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Notifica non trovata"));

        NotificationDto normalizedDto = normalizeDto(dto, entity.getSentByOperator());
        TherapeuticPlanEntity therapeuticPlan = resolveTherapeuticPlan(normalizedDto.getTherapeuticPlanId());
        NotificationDto persistedDto = enrichDoctorConfirmation(normalizedDto, therapeuticPlan);

        notificationMapper.updateEntity(entity, persistedDto, therapeuticPlan);
        NotificationEntity savedEntity = notificationRepository.save(entity);
        return notificationMapper.toDto(savedEntity);
    }

    @Transactional
    public void delete(Long id) {
        NotificationEntity entity = notificationRepository.findById(requireId(id))
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Notifica non trovata"));
        notificationRepository.delete(entity);
    }

    private NotificationDto normalizeDto(NotificationDto dto, String defaultOperator) {
        if (dto == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Payload notifica obbligatorio");
        }

        LocalDate sentDate = dto.getSentDate();
        LocalDate confirmationDate = dto.getConfirmationDate();
        String normalizedNotes = normalizeOptionalText(dto.getNotes());

        if (sentDate == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Data invio notifica obbligatoria");
        }

        validateConfirmationCombination(dto.getConfirmed(), confirmationDate, normalizedNotes);
        validateChronology(sentDate, confirmationDate);

        return NotificationDto.builder()
                .id(dto.getId())
                .therapeuticPlanId(requireForeignId(dto.getTherapeuticPlanId(), "Piano terapeutico obbligatorio"))
                .sentDate(sentDate)
                .sentByOperator(normalizeRequiredText(dto.getSentByOperator(), defaultOperator, "Operatore invio obbligatorio"))
                .subject(normalizeRequiredText(dto.getSubject(), null, "Oggetto obbligatorio"))
                .message(normalizeRequiredText(dto.getMessage(), null, "Messaggio obbligatorio"))
                .confirmed(dto.getConfirmed())
                .confirmationDate(confirmationDate)
                .confirmedByDoctor(normalizeOptionalText(dto.getConfirmedByDoctor()))
                .notes(normalizedNotes)
                .build();
    }

    private NotificationDto enrichDoctorConfirmation(NotificationDto dto, TherapeuticPlanEntity therapeuticPlan) {
        if (dto.getConfirmed() == null) {
            return NotificationDto.builder()
                    .id(dto.getId())
                    .therapeuticPlanId(dto.getTherapeuticPlanId())
                    .sentDate(dto.getSentDate())
                    .sentByOperator(dto.getSentByOperator())
                    .subject(dto.getSubject())
                    .message(dto.getMessage())
                    .confirmed(null)
                    .confirmationDate(null)
                    .confirmedByDoctor(null)
                    .notes(dto.getNotes())
                    .build();
        }

        if (therapeuticPlan.getDoctor() == null || therapeuticPlan.getDoctor().getFullName() == null
                || therapeuticPlan.getDoctor().getFullName().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Il piano terapeutico deve avere un medico associato per registrare la conferma della notifica");
        }

        return NotificationDto.builder()
                .id(dto.getId())
                .therapeuticPlanId(dto.getTherapeuticPlanId())
                .sentDate(dto.getSentDate())
                .sentByOperator(dto.getSentByOperator())
                .subject(dto.getSubject())
                .message(dto.getMessage())
                .confirmed(dto.getConfirmed())
                .confirmationDate(dto.getConfirmationDate())
                .confirmedByDoctor(therapeuticPlan.getDoctor().getFullName().trim())
                .notes(dto.getNotes())
                .build();
    }

    private TherapeuticPlanEntity resolveTherapeuticPlan(Long therapeuticPlanId) {
        return therapeuticPlanRepository.findById(therapeuticPlanId)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Piano terapeutico non trovato"));
    }

    private Long requireId(Long id) {
        if (id == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Id notifica obbligatorio");
        }
        return id;
    }

    private Long requireForeignId(Long id, String message) {
        if (id == null) {
            throw new ResponseStatusException(BAD_REQUEST, message);
        }
        return id;
    }

    private String normalizeRequiredText(String value, String fallback, String message) {
        String candidate = value != null && !value.isBlank() ? value : fallback;
        if (candidate == null || candidate.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, message);
        }
        return candidate.trim();
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private void validateConfirmationCombination(Boolean confirmed, LocalDate confirmationDate, String notes) {
        try {
            NotificationConfirmationRules.validateCombination(confirmed, confirmationDate, notes);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, exception.getMessage(), exception);
        }
    }

    private void validateChronology(LocalDate sentDate, LocalDate confirmationDate) {
        if (confirmationDate != null && confirmationDate.isBefore(sentDate)) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "La data conferma non puo precedere la data invio notifica");
        }
    }
}