package com.qtm.tenants.user.controller;

import com.qtm.commonlib.dto.UserDto;
import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.user.service.UserRemoteService;
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
        userRemoteService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
