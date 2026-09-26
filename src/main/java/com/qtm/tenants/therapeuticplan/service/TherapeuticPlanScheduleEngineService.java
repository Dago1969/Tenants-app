package com.qtm.tenants.therapeuticplan.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.qtm.commonlib.dto.PatientDto;
import com.qtm.commonlib.dto.TicketDto;
import com.qtm.external.client.HospitalClient;
import com.qtm.external.client.StructureDepartmentClient;
import com.qtm.tenants.appointment.entity.AppointmentEntity;
import com.qtm.tenants.appointment.entity.AppointmentTypeEntity;
import com.qtm.tenants.appointment.entity.RecurrenceType;
import com.qtm.tenants.appointment.repository.AppointmentRepository;
import com.qtm.tenants.appointment.repository.AppointmentTypeRepository;
import com.qtm.tenants.doctor.entity.DoctorEntity;
import com.qtm.tenants.doctor.repository.DoctorRepository;
import com.qtm.tenants.nurse.entity.NurseEntity;
import com.qtm.tenants.patient.service.DashboardPatientClient;
import com.qtm.tenants.project.service.DashboardProjectClient;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanDoctorAssignmentEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanEntity;
import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanVisitEntity;
import com.qtm.tenants.therapeuticplan.repository.TherapeuticPlanVisitRepository;
import com.qtm.tenants.ticket.client.TicketClient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Motore di calcolo per la generazione automatica del piano visite/accessi domiciliari
 * in base alla data e al tipo di dimissione dal reparto.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TherapeuticPlanScheduleEngineService {

    public static final String STATUS_PROPOSTO_AUTOMATICO = "PROPOSTO_AUTOMATICO";

    private final TherapeuticPlanVisitRepository visitRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentTypeRepository appointmentTypeRepository;
    private final DashboardProjectClient dashboardProjectClient;
    private final DashboardPatientClient dashboardPatientClient;
    private final DoctorRepository doctorRepository;
    private final TicketClient ticketClient;
    private final ObjectMapper objectMapper;
    private final HospitalClient hospitalClient;
    private final StructureDepartmentClient structureDepartmentClient;

    /**
     * Genera o rigenera le visite in stato PROPOSTO_AUTOMATICO per un piano terapeutico.
     * Per ciascun appuntamento/visita generato, crea anche il relativo ticket su QTMTicket associato all'infermiere prevalente.
     */
    @Transactional
    public void generateAutomaticVisits(TherapeuticPlanEntity planEntity) {
        if (planEntity == null || planEntity.getId() == null) {
            return;
        }

        // Rimuove le visite e gli appuntamenti creati precedentemente per evitare duplicati
        visitRepository.deleteByTherapeuticPlanIdAndStatus(planEntity.getId(), STATUS_PROPOSTO_AUTOMATICO);
        appointmentRepository.deleteByTherapeuticPlan_Id(planEntity.getId());

        LocalDate d0 = planEntity.getDischargeDate();
        String dischargeType = planEntity.getDischargeType();

        if (d0 == null || dischargeType == null || dischargeType.isBlank()) {
            log.info("Nessuna data o tipo dimissione impostato per il piano {}, generazione visite saltata.", planEntity.getId());
            return;
        }

        String typeNormalized = dischargeType.trim().toUpperCase(Locale.ROOT);
        List<VisitSpec> visitSpecs = new ArrayList<>();

        if ("NAIVE".equals(typeNormalized)) {
            buildNaiveSchedule(d0, planEntity.getEndDate(), visitSpecs);
        } else if ("SWITCH".equals(typeNormalized) || "SONDINO".equals(typeNormalized)) {
            buildSwitchOrSondinoSchedule(d0, planEntity.getEndDate(), visitSpecs);
        } else {
            log.warn("Tipo dimissione non riconosciuto: {} per il piano {}", dischargeType, planEntity.getId());
            return;
        }

        String structureName = resolveStructureName(planEntity);
        String projectTemplateJson = resolveProjectJsonVisit(planEntity.getProjectCode());

        // Individua l'infermiere prevalente
        NurseEntity prevalentNurse = null;
        if (planEntity.getPrevalentNurseAssignment() != null && planEntity.getPrevalentNurseAssignment().getNurse() != null) {
            prevalentNurse = planEntity.getPrevalentNurseAssignment().getNurse();
        } else if (planEntity.getNurseAssignments() != null && !planEntity.getNurseAssignments().isEmpty()) {
            prevalentNurse = planEntity.getNurseAssignments().get(0).getNurse();
        }

        AppointmentTypeEntity appointmentType = resolveDefaultAppointmentType();

        List<TherapeuticPlanVisitEntity> entitiesToSave = new ArrayList<>();
        List<AppointmentEntity> appointmentsToSave = new ArrayList<>();

        for (int i = 0; i < visitSpecs.size(); i++) {
            VisitSpec spec = visitSpecs.get(i);
            LocalDateTime visitDateTime = spec.date.atTime(9 + (i % 8), 0);

            String mergedJson = buildMergedJsonVisit(projectTemplateJson, spec.visitType, spec.notes);

            TherapeuticPlanVisitEntity visitEntity = TherapeuticPlanVisitEntity.builder()
                    .therapeuticPlanId(planEntity.getId())
                    .date(visitDateTime)
                    .type(spec.visitType)
                    .priority("MEDIUM")
                    .status(STATUS_PROPOSTO_AUTOMATICO)
                    .clinicalCenter(structureName)
                    .jsonVisit(mergedJson)
                    .build();

            entitiesToSave.add(visitEntity);

            if (prevalentNurse != null) {
                AppointmentEntity appointment = AppointmentEntity.builder()
                        .therapeuticPlan(planEntity)
                        .appointmentType(appointmentType)
                        .nurse(prevalentNurse)
                        .startDateTime(visitDateTime)
                        .endDateTime(visitDateTime.plusMinutes(45))
                        .recurrenceType(RecurrenceType.SINGLE)
                        .status("SCHEDULED")
                        .notes(spec.visitType + " - " + spec.notes)
                        .build();

                appointmentsToSave.add(appointment);
            }
        }

        visitRepository.saveAll(entitiesToSave);

        if (!appointmentsToSave.isEmpty()) {
            List<AppointmentEntity> savedAppointments = appointmentRepository.saveAll(appointmentsToSave);
            log.info("Creati {} appuntamenti per il piano {}", savedAppointments.size(), planEntity.getId());

            // Crea un ticket su QTMTicket per ciascun appuntamento associato all'infermiere prevalente
            for (AppointmentEntity app : savedAppointments) {
                createTicketForAppointment(app, prevalentNurse, planEntity);
            }
        }

        log.info("Generati {} accessi/visite automatici in stato {} per il piano {}",
                entitiesToSave.size(), STATUS_PROPOSTO_AUTOMATICO, planEntity.getId());
    }

    private void buildNaiveSchedule(LocalDate d0, LocalDate planEndDate, List<VisitSpec> specs) {
        // 1. Giorno 1 (D0 + 1): Primo Accesso Domiciliare (Retraining / Training)
        addSpecIfValid(d0.plusDays(1), "Primo Accesso Domiciliare", "Retraining / Training", planEndDate, specs);

        // 2. Giorni 2, 3, 4, 5 (D0 + 2, + 3, + 4, + 5): 4 accessi domiciliari giornalieri consecutivi
        for (int day = 2; day <= 5; day++) {
            addSpecIfValid(d0.plusDays(day), "Accesso Domiciliare Giornaliero", "Controllo stomia, medicazione, verifica tollerabilita", planEndDate, specs);
        }

        // 3. 17° Giorno (D0 + 17): Visita domiciliare intermedia (controllo clinico/motorio)
        addSpecIfValid(d0.plusDays(17), "Visita Domiciliare Intermedia", "Controllo clinico/motorio", planEndDate, specs);

        // 4. 30° Giorno (D0 + 30): Visita domiciliare di consolidamento al 1° mese
        addSpecIfValid(d0.plusDays(30), "Visita Domiciliare di Consolidamento", "Consolidamento 1° mese", planEndDate, specs);

        // 5. Follow-up Mesi (2°, 4°, 8°, 10°, 12° Mese da D0): Visita domiciliare
        int[] followUpMonths = {2, 4, 8, 10, 12};
        for (int month : followUpMonths) {
            addSpecIfValid(d0.plusMonths(month), "Visita Domiciliare Follow-up", "Follow-up " + month + "° Mese", planEndDate, specs);
        }

        // 6. Controllo Ospedaliero (6° Mese da D0): Visita ospedaliera con Neurologo e Infermiere Domiciliare
        addSpecIfValid(d0.plusMonths(6), "Controllo Ospedaliero", "Visita ospedaliera con Neurologo e Infermiere Domiciliare", planEndDate, specs);

        // 7. Dal 12° Mese in poi: Accessi domiciliari bimestrali fissi
        LocalDate maxDate = planEndDate != null ? planEndDate : d0.plusMonths(24);
        int currentMonth = 14;
        while (true) {
            LocalDate nextDate = d0.plusMonths(currentMonth);
            if (nextDate.isAfter(maxDate)) {
                break;
            }
            addSpecIfValid(nextDate, "Accesso Domiciliare Bimestrale Fisso", "Follow-up bimestrale " + currentMonth + "° Mese", planEndDate, specs);
            currentMonth += 2;
        }
    }

    private void buildSwitchOrSondinoSchedule(LocalDate d0, LocalDate planEndDate, List<VisitSpec> specs) {
        // 1. Giorno 1 (D0 + 1): Primo Accesso Domiciliare (Addestramento alla pompa e verifica parametri)
        addSpecIfValid(d0.plusDays(1), "Primo Accesso Domiciliare", "Addestramento alla pompa e verifica parametri", planEndDate, specs);

        // 2. 20° Giorno (D0 + 20): Visita domiciliare intermedia (controllo risposta motoria)
        addSpecIfValid(d0.plusDays(20), "Visita Domiciliare Intermedia", "Controllo risposta motoria", planEndDate, specs);

        // 3. Follow-up Mesi (2°, 4°, 8°, 10°, 12° Mese da D0): Visita domiciliare
        int[] followUpMonths = {2, 4, 8, 10, 12};
        for (int month : followUpMonths) {
            addSpecIfValid(d0.plusMonths(month), "Visita Domiciliare Follow-up", "Follow-up " + month + "° Mese", planEndDate, specs);
        }

        // 4. Controllo Ospedaliero (6° Mese da D0): Visita ospedaliera con Neurologo
        addSpecIfValid(d0.plusMonths(6), "Controllo Ospedaliero", "Visita ospedaliera con Neurologo", planEndDate, specs);

        // 5. Dal 12° Mese in poi: Follow-up a cadenza bimestrale fissa
        LocalDate maxDate = planEndDate != null ? planEndDate : d0.plusMonths(24);
        int currentMonth = 14;
        while (true) {
            LocalDate nextDate = d0.plusMonths(currentMonth);
            if (nextDate.isAfter(maxDate)) {
                break;
            }
            addSpecIfValid(nextDate, "Follow-up Bimestrale Fisso", "Follow-up bimestrale " + currentMonth + "° Mese", planEndDate, specs);
            currentMonth += 2;
        }
    }

    private void addSpecIfValid(LocalDate date, String visitType, String notes, LocalDate maxEndDate, List<VisitSpec> specs) {
        if (maxEndDate != null && date.isAfter(maxEndDate)) {
            return;
        }
        specs.add(new VisitSpec(date, visitType, notes));
    }

    private AppointmentTypeEntity resolveDefaultAppointmentType() {
        return appointmentTypeRepository.findAll().stream().findFirst().orElseGet(() ->
            appointmentTypeRepository.save(AppointmentTypeEntity.builder()
                .name("Visita Domiciliare")
                .description("Visita / Accesso domiciliare programmato")
                .durationMinutes(45)
                .build())
        );
    }

    private void createTicketForAppointment(AppointmentEntity appointment, NurseEntity nurse, TherapeuticPlanEntity planEntity) {
        if (ticketClient == null) {
            return;
        }
        try {
            String nurseName = nurse != null ? nurse.getFullName() : "N/D";
            Long nurseId = nurse != null ? nurse.getId() : null;
            String projectCode = planEntity != null && planEntity.getProjectCode() != null ? planEntity.getProjectCode() : "TENANTS";
            String patientIdStr = planEntity != null && planEntity.getPatientId() != null ? String.valueOf(planEntity.getPatientId()) : "";
            String planIdStr = planEntity != null && planEntity.getId() != null ? String.valueOf(planEntity.getId()) : "";
            Long hospitalId = planEntity != null ? planEntity.getStructureId() : null;
            Long departmentId = planEntity != null ? planEntity.getDepartmentId() : null;

            TicketDto ticketDto = TicketDto.builder()
                    // realm should contain the realm/client code where the user is operating (use projectCode if provided)
                    .realm(projectCode)
                    // project must contain the selected project code (use plan projectCode when available)
                    .project(planEntity.getProjectCode() != null && !planEntity.getProjectCode().isBlank() ? planEntity.getProjectCode() : "TENANTS")
                    .patientId(patientIdStr)
                    .therapeuticPlanId(planIdStr)
                    .visitDate(appointment.getStartDateTime())
                    .prevalentNurseId(nurseId != null ? String.valueOf(nurseId) : null)
                    .hospitalId(hospitalId != null ? String.valueOf(hospitalId) : null)
                    .departmentId(departmentId != null ? String.valueOf(departmentId) : null)
                    .ticketType("THERAPEUTIC_PLAN_UPDATE")
                    .status("OPEN")
                    .title("Appuntamento Visita: " + appointment.getNotes())
                    .description("Appuntamento programmato per il " + appointment.getStartDateTime() +
                            ". Infermiere prevalente: " + nurseName + (nurseId != null ? " (ID: " + nurseId + ")" : "") +
                            ". Dettagli: " + appointment.getNotes())
                    .contentJson(buildTicketContentJson(appointment, nurse, planEntity))
                    .build();

            ticketClient.createTicket(ticketDto);
            log.info("Ticket creato con successo per appuntamento ID {} dell'infermiere prevalente {}",
                    appointment.getId(), nurseName);
        } catch (Exception e) {
            log.warn("Impossibile creare il ticket su QTMTicket per l'appuntamento del {}: {}",
                    appointment.getStartDateTime(), e.getMessage());
        }
    }

    private String buildTicketContentJson(AppointmentEntity appointment, NurseEntity nurse, TherapeuticPlanEntity planEntity) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("appointmentId", appointment.getId());
            root.put("visitDate", appointment.getStartDateTime() != null ? appointment.getStartDateTime().toString() : null);
            root.put("startDateTime", appointment.getStartDateTime() != null ? appointment.getStartDateTime().toString() : null);
            root.put("endDateTime", appointment.getEndDateTime() != null ? appointment.getEndDateTime().toString() : null);
            root.put("status", appointment.getStatus());
            root.put("notes", appointment.getNotes());

            // Infermiere prevalente
            if (nurse != null) {
                root.put("prevalentNurseId", nurse.getId());
                root.put("prevalentNurseCode", nurse.getNurseProjectId());
                root.put("prevalentNurseName", nurse.getFullName());
                if (nurse.getEmail() != null) {
                    root.put("prevalentNurseEmail", nurse.getEmail());
                }
            }

            if (planEntity != null) {
                root.put("patientId", planEntity.getPatientId());
                root.put("therapeuticPlanId", planEntity.getId());
                root.put("dischargeType", planEntity.getDischargeType());
                root.put("dischargeDate", planEntity.getDischargeDate() != null ? planEntity.getDischargeDate().toString() : null);

                // Medico prevalente
                TherapeuticPlanDoctorAssignmentEntity doctorAssignment = planEntity.getPrevalentDoctorAssignment();
                DoctorEntity doctor = doctorAssignment != null ? doctorAssignment.getDoctor() : null;
                if (doctor != null) {
                    root.put("prevalentDoctorId", doctor.getId());
                    root.put("prevalentDoctorCode", doctor.getDoctorFlyerId());
                    root.put("prevalentDoctorName", doctor.getFullName());
                }

                // 1. Ospedale / Struttura (Chiamata a QTMDB: /api/hospital)
                Long structureId = planEntity.getStructureId();
                if (structureId != null) {
                    root.put("hospitalId", structureId);
                    try {
                        if (hospitalClient != null) {
                            var hospital = hospitalClient.getHospitalById(structureId);
                            if (hospital != null) {
                                if (hospital.getCodiceStruttura() != null) {
                                    root.put("hospitalCode", hospital.getCodiceStruttura());
                                }
                                if (hospital.getStruttura() != null) {
                                    root.put("hospitalName", hospital.getStruttura());
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Impossibile recuperare l'ospedale ID {} da QTMDB (/api/hospital): {}", structureId, e.getMessage());
                    }
                }

                // 2. Dipartimento / Reparto (Chiamata a QTMDB: /api/structure-departments)
                Long departmentId = planEntity.getDepartmentId();
                if (departmentId != null) {
                    root.put("departmentId", departmentId);
                    try {
                        if (structureDepartmentClient != null) {
                            var department = structureDepartmentClient.getDepartmentById(departmentId);
                            if (department != null) {
                                if (department.getReparto() != null) {
                                    root.put("departmentCode", department.getReparto());
                                }
                                if (department.getAreaFunzionale() != null) {
                                    root.put("departmentName", department.getAreaFunzionale());
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Impossibile recuperare il dipartimento ID {} da QTMDB (/api/structure-departments): {}", departmentId, e.getMessage());
                    }
                }

                // Enrich patient code and name via DashboardPatientClient if available
                try {
                    if (planEntity.getPatientId() != null && dashboardPatientClient != null) {
                        PatientDto patient = dashboardPatientClient.findById(planEntity.getPatientId());
                        if (patient != null) {
                            if (patient.getAssistedId() != null) {
                                root.put("patientCode", patient.getAssistedId());
                            }
                            String first = patient.getFirstName() == null ? "" : patient.getFirstName();
                            String last = patient.getLastName() == null ? "" : patient.getLastName();
                            String fullName = (first + " " + last).trim();
                            if (!fullName.isBlank()) {
                                root.put("patientName", fullName);
                            }
                            // also ensure patientId numeric/string is present
                            if (patient.getId() != null) {
                                root.put("patientId", patient.getId());
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            }
            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            return "{}";
        }
    }

    private String resolveStructureName(TherapeuticPlanEntity planEntity) {
        if (planEntity.getStructureId() == null) {
            return null;
        }
        try {
            if (hospitalClient != null) {
                var hospital = hospitalClient.getHospitalById(planEntity.getStructureId());
                return hospital != null ? hospital.getStruttura() : null;
            }
        } catch (Exception e) {
            log.warn("Impossibile recuperare il nome dell'ospedale ID {} da QTMDB (/api/hospital): {}", planEntity.getStructureId(), e.getMessage());
        }
        return null;
    }

    private String resolveProjectJsonVisit(String projectCode) {
        if (projectCode == null || projectCode.isBlank()) {
            return null;
        }
        try {
            var project = dashboardProjectClient.findByCodeAndCurrentTenant(projectCode);
            return project != null ? project.getJsonVisit() : null;
        } catch (Exception e) {
            log.warn("Impossibile recuperare il template jsonVisit per il progetto {}: {}", projectCode, e.getMessage());
            return null;
        }
    }

    private String buildMergedJsonVisit(String templateJson, String visitType, String notes) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            if (templateJson != null && !templateJson.isBlank()) {
                try {
                    ObjectNode parsed = (ObjectNode) objectMapper.readTree(templateJson);
                    root.setAll(parsed);
                } catch (Exception ignored) {
                }
            }
            root.put("type", visitType);
            root.put("status", STATUS_PROPOSTO_AUTOMATICO);
            if (notes != null) {
                root.put("notes", notes);
            }
            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            return "{\"type\":\"" + visitType + "\",\"status\":\"PROPOSTO_AUTOMATICO\"}";
        }
    }

    private static class VisitSpec {
        final LocalDate date;
        final String visitType;
        final String notes;

        VisitSpec(LocalDate date, String visitType, String notes) {
            this.date = date;
            this.visitType = visitType;
            this.notes = notes;
        }
    }
}