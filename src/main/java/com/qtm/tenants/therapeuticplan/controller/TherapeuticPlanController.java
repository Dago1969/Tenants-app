package com.qtm.tenants.therapeuticplan.controller;

import com.qtm.tenants.alert.dto.AlertDto;
import com.qtm.tenants.alert.service.AlertService;
import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanDto;
import com.qtm.tenants.therapeuticplan.service.TherapeuticPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

/**
 * REST controller per la gestione CRUD dei piani terapeutici con riferimenti clinici e logistici.
 */
@RestController
@RequestMapping("/api/tenants/therapeutic-plans")
@RequiredArgsConstructor
public class TherapeuticPlanController {

    private static final String MODULE_CODE = "THERAPEUTIC_PLAN";

    private final TherapeuticPlanService therapeuticPlanService;
        private final AlertService alertService;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @GetMapping
    public List<TherapeuticPlanDto> findAll(
            @RequestParam(required = false) String patientName,
            @RequestParam(required = false) String projectCode,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String drugCode,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return therapeuticPlanService.findAll(patientName, projectCode, status, drugCode);
    }

    @GetMapping("/{id}")
    public TherapeuticPlanDto findById(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return therapeuticPlanService.findById(id);
    }

    @GetMapping("/{id}/alerts")
    public List<AlertDto> findAlertsByTherapeuticPlan(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return alertService.findAll(id, null);
    }

    @PostMapping("/{id}/alerts")
    public AlertDto createAlert(
            @PathVariable Long id,
            @RequestBody AlertDto dto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return alertService.create(mergeAlertPlanId(dto, id));
    }

    @PutMapping("/{id}/alerts/{alertId}")
    public AlertDto updateAlert(
            @PathVariable Long id,
            @PathVariable Long alertId,
            @RequestBody AlertDto dto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        ensureAlertBelongsToPlan(alertId, id);
        return alertService.update(alertId, mergeAlertPlanId(dto, id));
    }

    @DeleteMapping("/{id}/alerts/{alertId}")
    public ResponseEntity<Void> deleteAlert(
            @PathVariable Long id,
            @PathVariable Long alertId,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.DELETE_FUNCTION_CODE
        );
        ensureAlertBelongsToPlan(alertId, id);
        alertService.delete(alertId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public TherapeuticPlanDto create(
            @RequestBody TherapeuticPlanDto dto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return therapeuticPlanService.create(dto);
    }

    @PutMapping("/{id}")
    public TherapeuticPlanDto update(
            @PathVariable Long id,
            @RequestBody TherapeuticPlanDto dto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        return therapeuticPlanService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.DELETE_FUNCTION_CODE
        );
        therapeuticPlanService.delete(id);
        return ResponseEntity.noContent().build();
    }

        private AlertDto mergeAlertPlanId(AlertDto dto, Long therapeuticPlanId) {
                if (dto == null) {
                        return AlertDto.builder().therapeuticPlanId(therapeuticPlanId).build();
                }

                return AlertDto.builder()
                                .id(dto.getId())
                                .therapeuticPlanId(therapeuticPlanId)
                                .doctorId(dto.getDoctorId())
                                .doctorName(dto.getDoctorName())
                                .date(dto.getDate())
                                .subject(dto.getSubject())
                                .confirmationRequired(dto.getConfirmationRequired())
                                .confirmationSent(dto.getConfirmationSent())
                                .build();
        }

        private void ensureAlertBelongsToPlan(Long alertId, Long therapeuticPlanId) {
                AlertDto existingAlert = alertService.findById(alertId);
                if (!therapeuticPlanId.equals(existingAlert.getTherapeuticPlanId())) {
                        throw new ResponseStatusException(BAD_REQUEST, "L'alert non appartiene al piano terapeutico specificato");
                }
        }
}