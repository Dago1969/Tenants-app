package com.qtm.tenants.appointment.service;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qtm.commonlib.dto.TicketDto;
import com.qtm.tenants.appointment.dto.AppointmentDto;
import com.qtm.tenants.appointment.entity.AppointmentEntity;
import com.qtm.tenants.appointment.entity.AppointmentTypeEntity;
import com.qtm.tenants.appointment.entity.RecurrenceType;
import com.qtm.tenants.appointment.mapper.AppointmentMapper;
import com.qtm.tenants.appointment.repository.AppointmentRepository;
import com.qtm.tenants.appointment.repository.AppointmentTypeRepository;
import com.qtm.tenants.nurse.entity.NurseEntity;
import com.qtm.tenants.nurse.repository.NurseRepository;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import com.qtm.tenants.therapeuticplan.repository.TherapeuticPlanRepository;
import com.qtm.tenants.ticket.client.TicketClient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service orchestratore degli appuntamenti con logica di ricorrenza e
 * validazioni di dominio.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AppointmentService {

	private final AppointmentRepository appointmentRepository;
	private final AppointmentTypeRepository appointmentTypeRepository;
	private final TherapeuticPlanRepository therapeuticPlanRepository;
	private final NurseRepository nurseRepository;
	private final AppointmentMapper appointmentMapper;
	private final TicketClient ticketClient;

	

	@Transactional(readOnly = true)
	public List<AppointmentDto> findByTherapeuticPlan(Long therapeuticPlanId) {
		validateTherapeuticPlanExists(therapeuticPlanId);
		return appointmentRepository.findByTherapeuticPlan_Id(therapeuticPlanId).stream().map(appointmentMapper::toDto)
				.toList();
	}

	/**
	 * Trova gli appuntamenti per un infermiere in una giornata specifica (per il
	 * dashboard NURSE_QTM). Di default mostra gli appuntamenti di oggi.
	 *
	 * @param nurseId ID dell'infermiere
	 * @param date    data per cui cercare gli appuntamenti (se null, usa oggi)
	 * @return lista di appuntamenti
	 */
	@Transactional(readOnly = true)
	public List<AppointmentDto> findByNurseAndDate(Long nurseId, LocalDate date) {
		validateNurseExists(nurseId);
		LocalDate queryDate = date != null ? date : LocalDate.now();
		return appointmentRepository.findByNurseAndDate(nurseId, queryDate).stream().map(appointmentMapper::toDto)
				.toList();
	}

	/**
	 * Trova gli appuntamenti per un infermiere in un intervallo di date (per il
	 * calendario).
	 *
	 * @param nurseId   ID dell'infermiere
	 * @param startDate data inizio intervallo
	 * @param endDate   data fine intervallo
	 * @return lista di appuntamenti
	 */
	@Transactional(readOnly = true)
	public List<AppointmentDto> findByNurseAndDateRange(Long nurseId, LocalDate startDate, LocalDate endDate) {
		validateNurseExists(nurseId);
		validateDateRange(startDate, endDate);
		return appointmentRepository.findByNurseAndDateRange(nurseId, startDate, endDate).stream()
				.map(appointmentMapper::toDto).toList();
	}

	/**
	 * Trova gli appuntamenti per un piano terapeutico in un intervallo di date.
	 *
	 * @param therapeuticPlanId ID del piano terapeutico
	 * @param startDate         data inizio intervallo
	 * @param endDate           data fine intervallo
	 * @return lista di appuntamenti
	 */
	@Transactional(readOnly = true)
	public List<AppointmentDto> findByTherapeuticPlanAndDateRange(Long therapeuticPlanId, LocalDate startDate,
			LocalDate endDate) {
		validateTherapeuticPlanExists(therapeuticPlanId);
		validateDateRange(startDate, endDate);
		return appointmentRepository.findByTherapeuticPlanAndDateRange(therapeuticPlanId, startDate, endDate).stream()
				.map(appointmentMapper::toDto).toList();
	}

	/**
	 * Crea un nuovo appuntamento, generando ricorrenze se necessario. La logica
	 * genera un record per ogni occorrenza fino a recurrenceEndDate.
	 *
	 * @param dto DTO dell'appuntamento
	 * @return DTO dell'appuntamento creato (primo record della serie)
	 */
	@Transactional
	public AppointmentDto create(AppointmentDto dto) {
		validateAppointmentDto(dto);

		TherapeuticPlanEntity therapeuticPlan = validateTherapeuticPlanAndGet(dto.getTherapeuticPlanId());
		AppointmentTypeEntity appointmentType = validateAppointmentTypeAndGet(dto.getAppointmentTypeId());
		NurseEntity nurse = validateNurseAndGet(dto.getNurseId());

		// Verifica che l'infermiere sia assegnato al piano terapeutico
		validateNurseIsAssignedToTherapeuticPlan(therapeuticPlan, nurse);

		// Crea lista di appuntamenti basata sulla ricorrenza
		List<AppointmentEntity> appointmentsToCreate = generateAppointmentOccurrences(dto, therapeuticPlan,
				appointmentType, nurse);

		// Salva tutti gli appuntamenti
		List<AppointmentEntity> savedAppointments = appointmentRepository.saveAll(appointmentsToCreate);

		log.info("Creati {} appuntamenti (ricorrenza: {})", savedAppointments.size(), dto.getRecurrenceType());

		// Per ogni appuntamento creato, crea un ticket associato all'infermiere
		for (AppointmentEntity app : savedAppointments) {
			try {
				NurseEntity assignedNurse = app.getNurse();
				TherapeuticPlanEntity plan = app.getTherapeuticPlan();
				String projectCode = plan != null && plan.getProjectCode() != null ? plan.getProjectCode() : "TENANTS";
				String patientIdStr = plan != null && plan.getPatientId() != null ? String.valueOf(plan.getPatientId())
						: "";
				String planIdStr = plan != null && plan.getId() != null ? String.valueOf(plan.getId()) : "";
				String nurseName = assignedNurse != null ? assignedNurse.getFullName() : "N/D";
				Long nurseId = assignedNurse != null ? assignedNurse.getId() : null;

				TicketDto ticketDto = TicketDto.builder()
						// realm should be the tenant/realm context — use projectCode as default
						.realm(projectCode)
						// project should represent the selected project code when available
						.project(therapeuticPlan.getProjectCode() != null && !therapeuticPlan.getProjectCode().isBlank()
								? therapeuticPlan.getProjectCode()
								: "TENANTS")
						.patientId(patientIdStr).therapeuticPlanId(planIdStr).visitDate(app.getStartDateTime())
						.prevalentNurseId(nurseId != null ? String.valueOf(nurseId) : null)
						.ticketType("THERAPEUTIC_PLAN_UPDATE").status("OPEN")
						.title("Appuntamento: "
								+ (app.getAppointmentType() != null ? app.getAppointmentType().getName() : "Visita"))
						.description("Appuntamento programmato per il " + app.getStartDateTime() + ". Infermiere: "
								+ nurseName + (nurseId != null ? " (ID: " + nurseId + ")" : "") + ". Note: "
								+ (app.getNotes() != null ? app.getNotes() : ""))
						.contentJson(buildAppointmentContentJson(app, assignedNurse, therapeuticPlan)).build();

				ticketClient.createTicket(ticketDto);
				log.info("Ticket creato con successo per l'appuntamento ID {}", app.getId());
			} catch (Exception e) {
				log.warn("Impossibile creare il ticket su QTMTicket per l'appuntamento {}: {}", app.getId(),
						e.getMessage());
			}
		}

		// Restituisci il primo (rappresentativo della serie)
		return appointmentMapper.toDto(savedAppointments.get(0));
	}

	/**
	 * Aggiorna un appuntamento.
	 *
	 * @param id  ID dell'appuntamento
	 * @param dto DTO con i dati aggiornati
	 * @return DTO dell'appuntamento aggiornato
	 */
	@Transactional
	public AppointmentDto update(Long id, AppointmentDto dto) {
		AppointmentEntity entity = appointmentRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Appuntamento non trovato"));

		validateAppointmentDto(dto);

		TherapeuticPlanEntity therapeuticPlan = validateTherapeuticPlanAndGet(dto.getTherapeuticPlanId());
		AppointmentTypeEntity appointmentType = validateAppointmentTypeAndGet(dto.getAppointmentTypeId());
		NurseEntity nurse = validateNurseAndGet(dto.getNurseId());

		validateNurseIsAssignedToTherapeuticPlan(therapeuticPlan, nurse);

		appointmentMapper.updateEntity(entity, dto, therapeuticPlan, appointmentType, nurse);
		AppointmentEntity savedEntity = appointmentRepository.save(entity);

		return appointmentMapper.toDto(savedEntity);
	}

	/**
	 * Elimina un appuntamento per ID.
	 *
	 * @param id ID dell'appuntamento
	 */
	@Transactional

	private String buildAppointmentContentJson(AppointmentEntity appointment, NurseEntity nurse,
			TherapeuticPlanEntity plan) {
		try {
			ObjectMapper mapper = new ObjectMapper();
			com.fasterxml.jackson.databind.node.ObjectNode root = mapper.createObjectNode();
			root.put("appointmentId", appointment.getId());
			root.put("visitDate",
					appointment.getStartDateTime() != null ? appointment.getStartDateTime().toString() : null);
			root.put("startDateTime",
					appointment.getStartDateTime() != null ? appointment.getStartDateTime().toString() : null);
			root.put("endDateTime",
					appointment.getEndDateTime() != null ? appointment.getEndDateTime().toString() : null);
			root.put("status", appointment.getStatus());
			root.put("notes", appointment.getNotes());
			if (nurse != null) {
				root.put("prevalentNurseId", nurse.getId());
				root.put("prevalentNurseCode", nurse.getNurseProjectId());
				root.put("prevalentNurseName", nurse.getFullName());
				if (nurse.getEmail() != null)
					root.put("prevalentNurseEmail", nurse.getEmail());
			}
			if (plan != null) {
				root.put("patientId", plan.getPatientId());
				root.put("therapeuticPlanId", plan.getId());
				root.put("dischargeType", plan.getDischargeType());
				root.put("dischargeDate", plan.getDischargeDate() != null ? plan.getDischargeDate().toString() : null);
				if (plan.getPatientId() != null) {
					try {
						// try to enrich with patient info via dashboard client if available
						// avoid adding new dependency here; leave enrichment to other services if
						// needed
					} catch (Exception ignored) {
					}
				}
			}
			return mapper.writeValueAsString(root);
		} catch (Exception e) {
			return "{}";
		}
	}

	public void delete(Long id) {
		AppointmentEntity entity = appointmentRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Appuntamento non trovato"));

		appointmentRepository.delete(entity);
		log.info("Appuntamento eliminato: {}", id);
	}

	/**
	 * Genera le occorrenze di un appuntamento in base al tipo di ricorrenza. Per
	 * SINGLE: genera un solo record Per DAILY/WEEKLY/MONTHLY: genera un record per
	 * ogni occorrenza fino a recurrenceEndDate
	 */
	private List<AppointmentEntity> generateAppointmentOccurrences(AppointmentDto dto,
			TherapeuticPlanEntity therapeuticPlan, AppointmentTypeEntity appointmentType, NurseEntity nurse) {
		List<AppointmentEntity> occurrences = new ArrayList<>();
		LocalDateTime currentStart = dto.getStartDateTime();
		LocalDateTime currentEnd = dto.getEndDateTime();
		LocalDate recurrenceEnd = dto.getRecurrenceEndDate();
		RecurrenceType recurrenceType = dto.getRecurrenceType();

		occurrences.add(appointmentMapper.toEntity(dto, therapeuticPlan, appointmentType, nurse));

		// Se non è ricorrente, termina qui
		if (RecurrenceType.SINGLE.equals(recurrenceType) || recurrenceEnd == null) {
			return occurrences;
		}

		// Generiamo le occorrenze successive in base al tipo di ricorrenza
		while (true) {
			LocalDateTime nextStart;
			LocalDateTime nextEnd;

			switch (recurrenceType) {
			case DAILY:
				nextStart = currentStart.plusDays(1);
				nextEnd = currentEnd.plusDays(1);
				break;
			case WEEKLY:
				nextStart = currentStart.plusWeeks(1);
				nextEnd = currentEnd.plusWeeks(1);
				break;
			case MONTHLY:
				nextStart = currentStart.plusMonths(1);
				nextEnd = currentEnd.plusMonths(1);
				break;
			default:
				return occurrences;
			}

			// Se la prossima occorrenza supera la data di fine ricorrenza, termina
			if (nextStart.toLocalDate().isAfter(recurrenceEnd)) {
				break;
			}

			AppointmentDto nextDto = AppointmentDto.builder().therapeuticPlanId(dto.getTherapeuticPlanId())
					.appointmentTypeId(dto.getAppointmentTypeId()).nurseId(dto.getNurseId()).startDateTime(nextStart)
					.endDateTime(nextEnd).recurrenceType(recurrenceType).recurrenceEndDate(recurrenceEnd)
					.reminderEnabled(dto.getReminderEnabled()).reminderMinutesBefore(dto.getReminderMinutesBefore())
					.status("SCHEDULED").notes(dto.getNotes()).build();

			occurrences.add(appointmentMapper.toEntity(nextDto, therapeuticPlan, appointmentType, nurse));

			currentStart = nextStart;
			currentEnd = nextEnd;
		}

		return occurrences;
	}

	// ==================== Validazioni ====================

	private void validateAppointmentDto(AppointmentDto dto) {
		if (dto == null) {
			throw new ResponseStatusException(BAD_REQUEST, "Payload appuntamento obbligatorio");
		}
		if (dto.getTherapeuticPlanId() == null) {
			throw new ResponseStatusException(BAD_REQUEST, "Piano terapeutico obbligatorio");
		}
		if (dto.getAppointmentTypeId() == null) {
			throw new ResponseStatusException(BAD_REQUEST, "Tipo appuntamento obbligatorio");
		}
		if (dto.getNurseId() == null) {
			throw new ResponseStatusException(BAD_REQUEST, "Infermiere obbligatorio");
		}
		if (dto.getStartDateTime() == null) {
			throw new ResponseStatusException(BAD_REQUEST, "Data/ora inizio obbligatoria");
		}
		if (dto.getEndDateTime() == null) {
			throw new ResponseStatusException(BAD_REQUEST, "Data/ora fine obbligatoria");
		}
		if (dto.getEndDateTime().isBefore(dto.getStartDateTime())) {
			throw new ResponseStatusException(BAD_REQUEST, "L'ora di fine non può precedere l'ora di inizio");
		}
		if (dto.getRecurrenceType() == null) {
			throw new ResponseStatusException(BAD_REQUEST, "Tipo ricorrenza obbligatorio");
		}
		if (!RecurrenceType.SINGLE.equals(dto.getRecurrenceType()) && dto.getRecurrenceEndDate() == null) {
			throw new ResponseStatusException(BAD_REQUEST, "Data fine ricorrenza obbligatoria per ricorrenze");
		}
		if (dto.getRecurrenceEndDate() != null
				&& dto.getRecurrenceEndDate().isBefore(dto.getStartDateTime().toLocalDate())) {
			throw new ResponseStatusException(BAD_REQUEST, "Data fine ricorrenza deve essere dopo la data inizio");
		}
	}

	private void validateDateRange(LocalDate startDate, LocalDate endDate) {
		if (startDate == null || endDate == null) {
			throw new ResponseStatusException(BAD_REQUEST, "Date inizio e fine obbligatorie");
		}
		if (endDate.isBefore(startDate)) {
			throw new ResponseStatusException(BAD_REQUEST, "Data fine non può precedere data inizio");
		}
	}

	private TherapeuticPlanEntity validateTherapeuticPlanAndGet(Long therapeuticPlanId) {
		return therapeuticPlanRepository.findById(therapeuticPlanId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Piano terapeutico non trovato"));
	}

	private void validateTherapeuticPlanExists(Long therapeuticPlanId) {
		if (!therapeuticPlanRepository.existsById(therapeuticPlanId)) {
			throw new ResponseStatusException(NOT_FOUND, "Piano terapeutico non trovato");
		}
	}

	private AppointmentTypeEntity validateAppointmentTypeAndGet(Long appointmentTypeId) {
		return appointmentTypeRepository.findById(appointmentTypeId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Tipo appuntamento non trovato"));
	}

	private NurseEntity validateNurseAndGet(Long nurseId) {
		return nurseRepository.findById(nurseId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Infermiere non trovato"));
	}

	private void validateNurseExists(Long nurseId) {
		if (!nurseRepository.existsById(nurseId)) {
			throw new ResponseStatusException(NOT_FOUND, "Infermiere non trovato");
		}
	}

	private void validateNurseIsAssignedToTherapeuticPlan(TherapeuticPlanEntity plan, NurseEntity nurse) {
		boolean isAssigned = plan.getNurseAssignments() != null && plan.getNurseAssignments().stream().anyMatch(
				assignment -> assignment.getNurse() != null && assignment.getNurse().getId().equals(nurse.getId()));

		if (!isAssigned) {
			throw new ResponseStatusException(BAD_REQUEST, "L'infermiere non è assegnato al piano terapeutico");
		}
	}

}
