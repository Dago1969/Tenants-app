package com.qtm.tenants.doctor.controller;

import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.doctor.dto.DoctorDto;
import com.qtm.tenants.doctor.service.DoctorService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Controller REST CRUD dottori.
 */
@RestController
@RequestMapping("/api/tenants/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private static final String MODULE_CODE = "DOCTOR";

    private final DoctorService doctorService;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @PostMapping
    public ResponseEntity<DoctorDto> create(
            @RequestBody DoctorDto doctorDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(doctorService.create(doctorDto));
    }

    /**
     * Azione specifica del modulo FUNCTION usata dalla matrice autorizzazioni per la funzione APPROVE.
     */
    @PostMapping("/approve/{code}")
        public ResponseEntity<DoctorDto> approve(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
            selectedRole,
            MODULE_CODE,
            ControllerFunctionAuthorizationService.APPROVE_FUNCTION_CODE
        );
        return ResponseEntity.ok(doctorService.findById(id));
    }

     /**
     * Azione specifica del modulo FUNCTION usata dalla matrice autorizzazioni per la funzione TEST.
     */
    @PostMapping("/test2/{code}")
        public ResponseEntity<DoctorDto> test2(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
            selectedRole,
            MODULE_CODE,
            ControllerFunctionAuthorizationService.APPROVE_FUNCTION_CODE
        );
        return ResponseEntity.ok(doctorService.findById(id));
    }

        @PostMapping("/test/{code}")
    public ResponseEntity<DoctorDto> test(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
            selectedRole,
            MODULE_CODE,
            ControllerFunctionAuthorizationService.APPROVE_FUNCTION_CODE
        );
        return ResponseEntity.ok(doctorService.findById(id));
    }

    @GetMapping
    public ResponseEntity<List<DoctorDto>> findAll(
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(doctorService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorDto> findById(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(doctorService.findById(id));
    }

    @GetMapping("/permissions")
    public ResponseEntity<Map<String, String>> getFieldPermissions(
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
        return ResponseEntity.ok(doctorService.getFieldAuthorizationsForCurrentRole());
    }

    @PutMapping("/{id}")
        public ResponseEntity<DoctorDto> update(
            @PathVariable Long id,
            @RequestBody DoctorDto doctorDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(doctorService.update(id, doctorDto));
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
        doctorService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
