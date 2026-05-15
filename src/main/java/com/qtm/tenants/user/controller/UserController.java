package com.qtm.tenants.user.controller;

import com.qtm.commonlib.dto.UserDto;
import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.otp.dto.OtpPhoneVerificationCheckRequest;
import com.qtm.tenants.otp.dto.OtpPhoneVerificationSendRequest;
import com.qtm.tenants.otp.dto.OtpVerificationCheckRequest;
import com.qtm.tenants.otp.dto.OtpVerificationResultResponse;
import com.qtm.tenants.otp.service.UserOtpService;
import com.qtm.tenants.user.dto.UserOnboardingRequest;
import com.qtm.tenants.user.service.UserDeletionCascadeService;
import com.qtm.tenants.user.service.UserOnboardingService;
import com.qtm.tenants.user.service.UserRemoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

import java.util.List;
 
/**
 * Controller REST utenti tenant delegato al repository remoto centralizzato in QTMDB.
 */
@RestController
@RequestMapping("/api/tenants/users")
@RequiredArgsConstructor
public class UserController {

        private static final Logger log = LoggerFactory.getLogger(UserController.class);

    private static final String MODULE_CODE = "USER";

        private final UserRemoteService userRemoteService;
        private final UserOnboardingService userOnboardingService;
        private final UserOtpService userOtpService;
        private final UserDeletionCascadeService userDeletionCascadeService;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @PostMapping
    public ResponseEntity<UserDto> create(
            @RequestBody UserDto userDto,
                        @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole,
                        @RequestHeader(name = "X-Selected-Client", required = false) String selectedClient
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
                enrichClientId(userDto, selectedClient);
        return ResponseEntity.ok(userRemoteService.create(userDto));
    }

    @PostMapping("/onboard")
    public ResponseEntity<UserDto> onboard(
            @RequestBody UserOnboardingRequest request,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole,
            @RequestHeader(name = "X-Selected-Client", required = false) String selectedClient
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        enrichClientId(request, selectedClient);
        return ResponseEntity.ok(userOnboardingService.onboard(request));
    }

        @GetMapping
        public ResponseEntity<List<UserDto>> findAll(
                        @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole,
                        @AuthenticationPrincipal Jwt jwt
        ) {
                if (jwt != null) {
                        String preferredUsername = jwt.getClaimAsString("preferred_username");
                        String username = jwt.getClaimAsString("username");
                        String sub = jwt.getSubject();
                        log.info("[TENANTS-APP] JWT subject: {}", sub);
                        log.info("[TENANTS-APP] JWT preferred_username: {}", preferredUsername);
                        log.info("[TENANTS-APP] JWT username: {}", username);
                        log.info("[TENANTS-APP] JWT claims: {}", jwt.getClaims());
                } else {
                        log.warn("[TENANTS-APP] Nessun principal JWT disponibile");
                }
                controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
                return ResponseEntity.ok(userRemoteService.findAll());
        }

    @GetMapping("/search")
        public ResponseEntity<List<UserDto>> search(
            @RequestParam(required = false) String username,
                        @RequestParam(required = false) String email,
            @RequestParam(required = false) String roleId,
            @RequestParam(required = false) Long structureId,
            @RequestParam(required = false) Boolean enabled,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
                return ResponseEntity.ok(userRemoteService.search(username, email, roleId, structureId, enabled));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> findById(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireModuleAccess(selectedRole, MODULE_CODE);
                return ResponseEntity.ok(userRemoteService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDto> update(
            @PathVariable Long id,
            @RequestBody UserDto userDto,
                        @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole,
                        @RequestHeader(name = "X-Selected-Client", required = false) String selectedClient
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
                enrichClientId(userDto, selectedClient);
        return ResponseEntity.ok(userRemoteService.update(id, userDto));
    }

    @PostMapping("/{id}/otp/send")
    public ResponseEntity<OtpVerificationResultResponse> sendOtp(
            @PathVariable Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(userOtpService.sendOtpForUser(id));
    }

    @PostMapping("/{id}/otp/check")
    public ResponseEntity<OtpVerificationResultResponse> checkOtp(
            @PathVariable Long id,
            @Valid @RequestBody OtpVerificationCheckRequest request,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                MODULE_CODE,
                ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(userOtpService.checkOtpForUser(id, request));
    }

    @PostMapping("/otp/send")
    public ResponseEntity<OtpVerificationResultResponse> sendOtpByPhone(
                        @Valid @RequestBody OtpPhoneVerificationSendRequest request
    ) {
                log.info("[UserController] OTP phone-only send richiesto phone={} channel={}", maskPhone(request != null ? request.getPhoneNumber() : null), request != null ? request.getChannel() : null);
        return ResponseEntity.ok(userOtpService.sendOtpForPhone(request));
    }

    @PostMapping("/otp/check")
    public ResponseEntity<OtpVerificationResultResponse> checkOtpByPhone(
                        @Valid @RequestBody OtpPhoneVerificationCheckRequest request
    ) {
                log.info("[UserController] OTP phone-only check richiesto phone={} channel={}", maskPhone(request != null ? request.getPhoneNumber() : null), request != null ? request.getChannel() : null);
        return ResponseEntity.ok(userOtpService.checkOtpForPhone(request));
    }

        private void enrichClientId(UserDto userDto, String selectedClient) {
                if (userDto == null) {
                        return;
                }

                if (userDto.getClientId() != null && !userDto.getClientId().isBlank()) {
                        return;
                }

                if (selectedClient != null && !selectedClient.isBlank()) {
                        userDto.setClientId(selectedClient.trim());
                }
        }

        private String maskPhone(String phoneNumber) {
                if (phoneNumber == null || phoneNumber.isBlank()) {
                        return "";
                }
                String trimmed = phoneNumber.trim();
                if (trimmed.length() <= 4) {
                        return "****";
                }
                return "***" + trimmed.substring(trimmed.length() - 4);
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
        // Utilizza il servizio di eliminazione cascata che gestisce relazioni piano-infermiera e infermiere
        userDeletionCascadeService.deleteUserWithCascade(id);
        return ResponseEntity.noContent().build();
    }
}
