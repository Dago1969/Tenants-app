package com.qtm.tenants.appointment.controller;

import com.qtm.tenants.appointment.dto.AppointmentDto;
import com.qtm.tenants.appointment.dto.AppointmentTypeDto;
import com.qtm.tenants.appointment.entity.AppointmentTypeEntity;
import com.qtm.tenants.appointment.mapper.AppointmentTypeMapper;
import com.qtm.tenants.appointment.repository.AppointmentTypeRepository;
import com.qtm.tenants.appointment.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller REST per la gestione degli appuntamenti nel piano terapeutico.
 */
@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final AppointmentTypeRepository appointmentTypeRepository;
    private final AppointmentTypeMapper appointmentTypeMapper;

    // ==================== AppointmentType (CRUD base) ====================

    /**
     * Recupera tutti i tipi di appuntamento disponibili.
     *
     * @return lista di tipi appuntamento
     */
    @GetMapping("/types")
    public List<AppointmentTypeDto> getAllAppointmentTypes() {
        return appointmentTypeRepository.findAll()
                .stream()
                .map(appointmentTypeMapper::toDto)
                .toList();
    }

    /**
     * Crea un nuovo tipo di appuntamento.
     *
     * @param dto DTO del tipo appuntamento
     * @return tipo appuntamento creato
     */
    @PostMapping("/types")
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentTypeDto createAppointmentType(@RequestBody AppointmentTypeDto dto) {
        AppointmentTypeEntity entity = appointmentTypeMapper.toEntity(dto);
        AppointmentTypeEntity saved = appointmentTypeRepository.save(entity);
        return appointmentTypeMapper.toDto(saved);
    }

    /**
     * Aggiorna un tipo di appuntamento.
     *
     * @param id ID del tipo appuntamento
     * @param dto DTO con i dati aggiornati
     * @return tipo appuntamento aggiornato
     */
    @PutMapping("/types/{id}")
    public AppointmentTypeDto updateAppointmentType(
            @PathVariable Long id,
            @RequestBody AppointmentTypeDto dto
    ) {
        AppointmentTypeEntity entity = appointmentTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tipo appuntamento non trovato"));
        appointmentTypeMapper.updateEntity(entity, dto);
        AppointmentTypeEntity saved = appointmentTypeRepository.save(entity);
        return appointmentTypeMapper.toDto(saved);
    }

    /**
     * Elimina un tipo di appuntamento.
     *
     * @param id ID del tipo appuntamento
     */
    @DeleteMapping("/types/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAppointmentType(@PathVariable Long id) {
        appointmentTypeRepository.deleteById(id);
    }

    // ==================== Appointment (CRUD e query) ====================

    /**
     * Crea un nuovo appuntamento (o serie di appuntamenti ricorrenti).
     *
     * @param dto DTO dell'appuntamento
     * @return appuntamento creato
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentDto createAppointment(@RequestBody AppointmentDto dto) {
        return appointmentService.create(dto);
    }

    /**
     * Aggiorna un appuntamento.
     *
     * @param id ID dell'appuntamento
     * @param dto DTO con i dati aggiornati
     * @return appuntamento aggiornato
     */
    @PutMapping("/{id}")
    public AppointmentDto updateAppointment(
            @PathVariable Long id,
            @RequestBody AppointmentDto dto
    ) {
        return appointmentService.update(id, dto);
    }

    /**
     * Elimina un appuntamento.
     *
     * @param id ID dell'appuntamento
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAppointment(@PathVariable Long id) {
        appointmentService.delete(id);
    }

    // ==================== Query per visualizzazione ====================

    /**
     * Recupera gli appuntamenti di un piano terapeutico.
     *
     * @param planId ID del piano terapeutico
     * @return lista di appuntamenti
     */
    @GetMapping("/therapeutic-plan/{planId}")
    public List<AppointmentDto> getByTherapeuticPlan(@PathVariable Long planId) {
        return appointmentService.findByTherapeuticPlan(planId);
    }

    /**
     * Recupera gli appuntamenti di un infermiere per una giornata specifica.
     * Se non viene passata una data, usa oggi (per il dashboard NURSE_QTM).
     *
     * @param nurseId ID dell'infermiere
     * @param date data (opzionale, default: oggi)
     * @return lista di appuntamenti per la giornata
     */
    @GetMapping("/nurse/{nurseId}/daily")
    public List<AppointmentDto> getByNurseAndDate(
            @PathVariable Long nurseId,
            @RequestParam(required = false) LocalDate date
    ) {
        return appointmentService.findByNurseAndDate(nurseId, date);
    }

    /**
     * Recupera gli appuntamenti di un infermiere in un intervallo di date (per il calendario).
     *
     * @param nurseId ID dell'infermiere
     * @param startDate data inizio (formato YYYY-MM-DD)
     * @param endDate data fine (formato YYYY-MM-DD)
     * @return lista di appuntamenti nell'intervallo
     */
    @GetMapping("/nurse/{nurseId}/calendar")
    public List<AppointmentDto> getByNurseAndDateRange(
            @PathVariable Long nurseId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate
    ) {
        return appointmentService.findByNurseAndDateRange(nurseId, startDate, endDate);
    }

    /**
     * Recupera gli appuntamenti di un piano terapeutico in un intervallo di date.
     *
     * @param planId ID del piano terapeutico
     * @param startDate data inizio (formato YYYY-MM-DD)
     * @param endDate data fine (formato YYYY-MM-DD)
     * @return lista di appuntamenti nell'intervallo
     */
    @GetMapping("/therapeutic-plan/{planId}/range")
    public List<AppointmentDto> getByTherapeuticPlanAndDateRange(
            @PathVariable Long planId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate
    ) {
        return appointmentService.findByTherapeuticPlanAndDateRange(planId, startDate, endDate);
    }
}
