package com.qtm.tenants.authorization;

import com.qtm.tenants.authorization.dto.AuthorizationRoleMatrixDto;
import com.qtm.tenants.authorization.dto.AuthorizationUpdateRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller REST per gestione autorizzazioni per ruolo raggruppate per modulo.
 */
@RestController
@RequestMapping("/api/tenants/authorizations")
@RequiredArgsConstructor
public class AuthorizationManagementController {

    private final AuthorizationManagementService authorizationManagementService;

    @GetMapping("/roles/{roleId}")
    public ResponseEntity<AuthorizationRoleMatrixDto> getRoleMatrix(@PathVariable String roleId) {
        return ResponseEntity.ok(authorizationManagementService.getRoleMatrix(roleId));
    }

    @PutMapping("/roles/{roleId}")
    public ResponseEntity<AuthorizationRoleMatrixDto> updateRoleMatrix(
            @PathVariable String roleId,
            @RequestBody AuthorizationUpdateRequestDto request
    ) {
        return ResponseEntity.ok(authorizationManagementService.updateRoleMatrix(roleId, request));
    }
}
