package com.qtm.tenants.therapeuticplan.controller;

import com.qtm.tenants.alert.dto.AlertDto;
import com.qtm.tenants.alert.service.AlertService;
import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.notification.dto.NotificationDto;
import com.qtm.tenants.notification.service.NotificationService;
import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanActivityBookingDto;
import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanContactRequestDto;
import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanDto;
import com.qtm.tenants.therapeuticplan.service.TherapeuticPlanActivityBookingService;
import com.qtm.tenants.therapeuticplan.service.TherapeuticPlanContactRequestService;
import com.qtm.tenants.therapeuticplan.service.TherapeuticPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
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
        private final NotificationService notificationService;
        private final TherapeuticPlanActivityBookingService activityBookingService;
                private final TherapeuticPlanContactRequestService contactRequestService;
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

        @GetMapping("/{id}/notifications")
        public List<NotificationDto> findNotificationsByTherapeuticPlan(
                        @PathVariable Long id,
                        @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
        ) {
                controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
                return notificationService.findAll(id);
        }

        @GetMapping("/{id}/activity-bookings")
        public List<TherapeuticPlanActivityBookingDto> findActivityBookingsByTherapeuticPlan(
                        @PathVariable Long id,
                        @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
        ) {
                controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
                return activityBookingService.findAll(id);
        }

        @GetMapping("/{id}/contact-requests")
        public List<TherapeuticPlanContactRequestDto> findContactRequestsByTherapeuticPlan(
                        @PathVariable Long id,
                        @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
        ) {
                controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
                return contactRequestService.findAll(id);
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

    @PostMapping("/{id}/notifications")
    public NotificationDto createNotification(
            @PathVariable Long id,
            @RequestBody NotificationDto dto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole,
            @AuthenticationPrincipal Jwt jwt
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return notificationService.create(mergeNotificationPlanId(dto, id, resolveOperatorLabel(jwt)), resolveOperatorLabel(jwt));
    }

    @PostMapping("/{id}/activity-bookings")
    public TherapeuticPlanActivityBookingDto createActivityBooking(
            @PathVariable Long id,
            @RequestBody TherapeuticPlanActivityBookingDto dto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return activityBookingService.create(mergeActivityBookingPlanId(dto, id));
    }

        @PostMapping("/{id}/contact-requests")
        public TherapeuticPlanContactRequestDto createContactRequest(
                        @PathVariable Long id,
                        @RequestBody TherapeuticPlanContactRequestDto dto,
                        @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
        ) {
                controllerFunctionAuthorizationService.requireFullEditPermission(
                                selectedRole,
                                MODULE_CODE,
                                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
                );
                return contactRequestService.create(mergeContactRequestPlanId(dto, id));
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

        @PutMapping("/{id}/notifications/{notificationId}")
        public NotificationDto updateNotification(
                        @PathVariable Long id,
                        @PathVariable Long notificationId,
                        @RequestBody NotificationDto dto,
                        @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
        ) {
                controllerFunctionAuthorizationService.requireFullEditPermission(
                                selectedRole,
                                MODULE_CODE,
                                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
                );
                ensureNotificationBelongsToPlan(notificationId, id);
                return notificationService.update(notificationId, mergeNotificationPlanId(dto, id, null));
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

        @DeleteMapping("/{id}/notifications/{notificationId}")
        public ResponseEntity<Void> deleteNotification(
                        @PathVariable Long id,
                        @PathVariable Long notificationId,
                        @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
        ) {
                controllerFunctionAuthorizationService.requireFullEditPermission(
                                selectedRole,
                                MODULE_CODE,
                                ControllerFunctionAuthorizationService.DELETE_FUNCTION_CODE
                );
                ensureNotificationBelongsToPlan(notificationId, id);
                notificationService.delete(notificationId);
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

        private NotificationDto mergeNotificationPlanId(NotificationDto dto, Long therapeuticPlanId, String sentByOperator) {
                if (dto == null) {
                        return NotificationDto.builder()
                                        .therapeuticPlanId(therapeuticPlanId)
                                        .sentByOperator(sentByOperator)
                                        .build();
                }

                return NotificationDto.builder()
                                .id(dto.getId())
                                .therapeuticPlanId(therapeuticPlanId)
                                .sentDate(dto.getSentDate())
                                .sentByOperator(sentByOperator != null ? sentByOperator : dto.getSentByOperator())
                                .subject(dto.getSubject())
                                .message(dto.getMessage())
                                .confirmed(dto.getConfirmed())
                                .confirmationDate(dto.getConfirmationDate())
                                .confirmedByDoctor(dto.getConfirmedByDoctor())
                                .notes(dto.getNotes())
                                .build();
        }

        private TherapeuticPlanActivityBookingDto mergeActivityBookingPlanId(TherapeuticPlanActivityBookingDto dto, Long therapeuticPlanId) {
                if (dto == null) {
                        return TherapeuticPlanActivityBookingDto.builder()
                                        .therapeuticPlanId(therapeuticPlanId)
                                        .build();
                }

                return TherapeuticPlanActivityBookingDto.builder()
                                .id(dto.getId())
                                .therapeuticPlanId(therapeuticPlanId)
                                .bookingDate(dto.getBookingDate())
                                .visitType(dto.getVisitType())
                                .protocolPlanned(dto.getProtocolPlanned())
                                .build();
        }

        private TherapeuticPlanContactRequestDto mergeContactRequestPlanId(TherapeuticPlanContactRequestDto dto, Long therapeuticPlanId) {
                if (dto == null) {
                        return TherapeuticPlanContactRequestDto.builder()
                                        .therapeuticPlanId(therapeuticPlanId)
                                        .build();
                }

                return TherapeuticPlanContactRequestDto.builder()
                                .id(dto.getId())
                                .therapeuticPlanId(therapeuticPlanId)
                                .requestDate(dto.getRequestDate())
                                .requestType(dto.getRequestType())
                                .outpatientClinic(dto.getOutpatientClinic())
                                .status(dto.getStatus())
                                .build();
        }

        private String resolveOperatorLabel(Jwt jwt) {
                if (jwt == null) {
                        return null;
                }

                String preferredUsername = trimToNull(jwt.getClaimAsString("preferred_username"));
                if (preferredUsername != null) {
                        return preferredUsername;
                }

                String username = trimToNull(jwt.getClaimAsString("username"));
                if (username != null) {
                        return username;
                }

                String email = trimToNull(jwt.getClaimAsString("email"));
                if (email != null) {
                        return email;
                }

                return trimToNull(jwt.getSubject());
        }

        private String trimToNull(String value) {
                if (value == null || value.isBlank()) {
                        return null;
                }
                return value.trim();
        }

        private void ensureAlertBelongsToPlan(Long alertId, Long therapeuticPlanId) {
                AlertDto existingAlert = alertService.findById(alertId);
                if (!therapeuticPlanId.equals(existingAlert.getTherapeuticPlanId())) {
                        throw new ResponseStatusException(BAD_REQUEST, "L'alert non appartiene al piano terapeutico specificato");
                }
        }

        private void ensureNotificationBelongsToPlan(Long notificationId, Long therapeuticPlanId) {
                NotificationDto existingNotification = notificationService.findById(notificationId);
                if (!therapeuticPlanId.equals(existingNotification.getTherapeuticPlanId())) {
                        throw new ResponseStatusException(BAD_REQUEST, "La notifica non appartiene al piano terapeutico specificato");
                }
        }
}