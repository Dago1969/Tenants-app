package com.qtm.tenants.authorization.service;

import com.qtm.tenants.authorization.AuthorizationScope;
import com.qtm.tenants.authorization.ModuleRoleAuthorizationEntity;
import com.qtm.tenants.authorization.ModuleRoleAuthorizationRepository;
import com.qtm.tenants.authorization.entity.FunctionModuleRoleAuthorizationEntity;
import com.qtm.tenants.authorization.repository.FunctionModuleRoleAuthorizationRepository;
import com.qtm.tenants.controllerfunction.ControllerMethodFunctionService;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import static org.springframework.http.HttpStatus.FORBIDDEN;

/**
 * Servizio centralizzato per verificare i permessi di modulo e funzione dei controller.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ControllerFunctionAuthorizationService {

    public static final String CREATE_FUNCTION_CODE = "CREATE";
    public static final String READ_FUNCTION_CODE = "READ";
    public static final String SEARCH_FUNCTION_CODE = "SEARCH";
    public static final String UPDATE_FUNCTION_CODE = "UPDATE";
    public static final String DELETE_FUNCTION_CODE = "DELETE";
    public static final String APPROVE_FUNCTION_CODE = "APPROVE";

    private final FunctionModuleRoleAuthorizationRepository functionModuleRoleAuthorizationRepository;
    private final ModuleRoleAuthorizationRepository moduleRoleAuthorizationRepository;
    private final ControllerMethodFunctionService controllerMethodFunctionService;

    /**
     * Risolve le funzioni visibili per il modulo leggendo i metodi del controller registrato.
     */
    public List<String> getSupportedFunctionCodes(String moduleCode) {
        return controllerMethodFunctionService.getSupportedFunctionCodes(moduleCode);
    }

    public boolean isCommonFunctionCode(String functionCode) {
        return controllerMethodFunctionService.isCommonFunctionCode(functionCode);
    }

    public void requireModuleAccess(String selectedRole, String moduleCode) {
        log.info("[ControllerFunctionAuthorizationService] requireModuleAccess start moduleCode={} incomingSelectedRole={}",
                moduleCode,
                selectedRole);
        String resolvedRole = resolveEffectiveRole(selectedRole, moduleCode)
            .orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "Ruolo selezionato mancante"));

        AuthorizationScope resolvedScope = resolveModuleScope(resolvedRole, moduleCode);
        log.info("[ControllerFunctionAuthorizationService] requireModuleAccess resolved moduleCode={} resolvedRole={} moduleScope={}",
                moduleCode,
                resolvedRole,
                resolvedScope);
        if (!resolvedScope.allowsModuleAccess()) {
            log.warn("[ControllerFunctionAuthorizationService] requireModuleAccess denied moduleCode={} resolvedRole={} moduleScope={}",
                    moduleCode,
                    resolvedRole,
                    resolvedScope);
            throw new ResponseStatusException(
                FORBIDDEN,
                "Modulo non consentito per il ruolo selezionato: " + moduleCode
            );
        }
    }

    public void requireFunctionAccess(String selectedRole, String moduleCode, String functionCode) {
        log.info("[ControllerFunctionAuthorizationService] requireFunctionAccess start moduleCode={} functionCode={} incomingSelectedRole={}",
                moduleCode,
                functionCode,
                selectedRole);
        String resolvedRole = resolveEffectiveRole(selectedRole, moduleCode)
            .orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "Ruolo selezionato mancante"));

        AuthorizationScope moduleScope = resolveModuleScope(resolvedRole, moduleCode);
        log.info("[ControllerFunctionAuthorizationService] requireFunctionAccess module scope moduleCode={} functionCode={} resolvedRole={} moduleScope={}",
                moduleCode,
                functionCode,
                resolvedRole,
                moduleScope);
        if (!moduleScope.allowsModuleAccess()) {
            log.warn("[ControllerFunctionAuthorizationService] requireFunctionAccess denied at module level moduleCode={} functionCode={} resolvedRole={} moduleScope={}",
                    moduleCode,
                    functionCode,
                    resolvedRole,
                    moduleScope);
            throw new ResponseStatusException(
                FORBIDDEN,
                "Modulo non consentito per il ruolo selezionato: " + moduleCode
            );
        }

        Optional<FunctionModuleRoleAuthorizationEntity> functionAuthorization = functionModuleRoleAuthorizationRepository
                .findByRoleIdAndModuleCodeAndFunctionCode(resolvedRole, moduleCode, functionCode);
        AuthorizationScope resolvedScope = functionAuthorization
                .map(FunctionModuleRoleAuthorizationEntity::getAuthorization)
                .orElse(moduleScope);

        log.info("[ControllerFunctionAuthorizationService] requireFunctionAccess resolved moduleCode={} functionCode={} resolvedRole={} explicitFunctionScope={} effectiveScope={}",
                moduleCode,
                functionCode,
                resolvedRole,
                functionAuthorization.map(FunctionModuleRoleAuthorizationEntity::getAuthorization).orElse(null),
                resolvedScope);

        if (!resolvedScope.allowsFunctionExecution()) {
            log.warn("[ControllerFunctionAuthorizationService] requireFunctionAccess denied at function level moduleCode={} functionCode={} resolvedRole={} effectiveScope={}",
                    moduleCode,
                    functionCode,
                    resolvedRole,
                    resolvedScope);
            throw new ResponseStatusException(
                    FORBIDDEN,
                    "Operazione non consentita per il ruolo selezionato: " + moduleCode + "/" + functionCode
            );
        }
    }

    public void requireFullEditPermission(String selectedRole, String moduleCode, String functionCode) {
        requireFunctionAccess(selectedRole, moduleCode, functionCode);
    }

    private AuthorizationScope resolveModuleScope(String selectedRole, String moduleCode) {
        AuthorizationScope scope = moduleRoleAuthorizationRepository
                .findByModuleCodeAndRoleId(moduleCode, selectedRole)
                .map(ModuleRoleAuthorizationEntity::getAuthorization)
                .orElse(AuthorizationScope.ALLOW);
        log.debug("[ControllerFunctionAuthorizationService] resolveModuleScope moduleCode={} roleId={} scope={}",
            moduleCode,
            selectedRole,
            scope);
        return scope;
    }

    private Optional<String> resolveEffectiveRole(String selectedRole, String moduleCode) {
        Optional<String> roleFromArgument = resolveConfiguredRoleId(selectedRole, moduleCode);
        if (roleFromArgument.isPresent()) {
            log.info("[ControllerFunctionAuthorizationService] resolveEffectiveRole moduleCode={} source=method-argument rawValue={} resolvedRole={}",
                moduleCode,
                selectedRole,
                roleFromArgument.get());
            return roleFromArgument;
        }

        Optional<String> roleFromHeader = resolveRoleFromRequestHeader(moduleCode);
        if (roleFromHeader.isPresent()) {
            log.info("[ControllerFunctionAuthorizationService] resolveEffectiveRole moduleCode={} source=request-header resolvedRole={}",
                moduleCode,
                roleFromHeader.get());
            return roleFromHeader;
        }

        Optional<String> roleFromSecurityContext = resolveRoleFromSecurityContext(moduleCode);
        if (roleFromSecurityContext.isPresent()) {
            log.info("[ControllerFunctionAuthorizationService] resolveEffectiveRole moduleCode={} source=security-context resolvedRole={}",
                moduleCode,
                roleFromSecurityContext.get());
        } else {
            log.warn("[ControllerFunctionAuthorizationService] resolveEffectiveRole moduleCode={} no role resolved incomingSelectedRole={}",
                moduleCode,
                selectedRole);
        }
        return roleFromSecurityContext;
    }

    private Optional<String> resolveRoleFromRequestHeader(String moduleCode) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            log.debug("[ControllerFunctionAuthorizationService] resolveRoleFromRequestHeader moduleCode={} request attributes assenti", moduleCode);
            return Optional.empty();
        }

        HttpServletRequest request = attributes.getRequest();
        String headerRole = request.getHeader("X-Selected-Role");
        Optional<String> resolvedRole = resolveConfiguredRoleId(headerRole, moduleCode);
        log.info("[ControllerFunctionAuthorizationService] resolveRoleFromRequestHeader moduleCode={} rawHeaderRole={} resolvedRole={}",
            moduleCode,
            headerRole,
            resolvedRole.orElse(null));
        return resolvedRole;
    }

    private Optional<String> resolveRoleFromSecurityContext(String moduleCode) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            log.debug("[ControllerFunctionAuthorizationService] resolveRoleFromSecurityContext moduleCode={} authentication assente o non autenticata", moduleCode);
            return Optional.empty();
        }

        List<String> candidates = Stream.concat(
                        authentication.getAuthorities().stream()
                                .map(GrantedAuthority::getAuthority)
                                .map(this::normalizeRoleCandidate),
                        extractRolesFromPrincipal(authentication.getPrincipal()).stream()
                                .map(this::normalizeRoleCandidate)
                )
                .filter(value -> value != null && !value.isBlank())
                .distinct()
            .toList();

        Optional<String> resolvedRole = candidates.stream()
            .map(this::toPossibleRoleIds)
                .flatMap(Collection::stream)
                .map(candidate -> resolveConfiguredRoleId(candidate, moduleCode))
                .flatMap(Optional::stream)
                .findFirst();

        log.info("[ControllerFunctionAuthorizationService] resolveRoleFromSecurityContext moduleCode={} authorities={} candidates={} resolvedRole={}",
            moduleCode,
            authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList(),
            candidates,
            resolvedRole.orElse(null));
        return resolvedRole;
    }

    private List<String> extractRolesFromPrincipal(Object principal) {
        if (!(principal instanceof Jwt jwt)) {
            return List.of();
        }

        Stream<String> realmRoles = Stream.empty();
        Object realmAccess = jwt.getClaim("realm_access");
        if (realmAccess instanceof Map<?, ?> map) {
            Object rolesObj = map.get("roles");
            if (rolesObj instanceof Collection<?> roles) {
                realmRoles = roles.stream().map(String::valueOf);
            }
        }

        Stream<String> directRoles = Stream.of("roles", "role", "authorities")
                .map(jwt::getClaim)
                .flatMap(claim -> {
                    if (claim instanceof Collection<?> values) {
                        return values.stream().map(String::valueOf);
                    }
                    if (claim instanceof String value) {
                        return Stream.of(value);
                    }
                    return Stream.empty();
                });

        return Stream.concat(realmRoles, directRoles)
                .filter(value -> value != null && !value.isBlank())
                .distinct()
                .toList();
    }

    private String normalizeRoleCandidate(String candidate) {
        if (candidate == null) {
            return null;
        }

        String normalized = candidate.trim();
        if (normalized.startsWith("ROLE_")) {
            return normalized;
        }
        if (normalized.startsWith("SCOPE_")) {
            return normalized.substring("SCOPE_".length());
        }
        return normalized;
    }

    private List<String> toPossibleRoleIds(String candidate) {
        if (candidate == null || candidate.isBlank()) {
            return List.of();
        }
        if (candidate.startsWith("ROLE_")) {
            return List.of(candidate, candidate.substring("ROLE_".length()));
        }
        return List.of(candidate, "ROLE_" + candidate);
    }

    private Optional<String> resolveConfiguredRoleId(String candidate, String moduleCode) {
        if (candidate == null || candidate.isBlank()) {
            log.debug("[ControllerFunctionAuthorizationService] resolveConfiguredRoleId moduleCode={} candidate vuoto", moduleCode);
            return Optional.empty();
        }

        List<String> possibleRoleIds = toPossibleRoleIds(candidate.trim());
        Optional<String> resolvedRole = possibleRoleIds.stream()
                .map(roleId -> findConfiguredRoleId(roleId, moduleCode))
                .flatMap(Optional::stream)
                .findFirst();

        log.info("[ControllerFunctionAuthorizationService] resolveConfiguredRoleId moduleCode={} rawCandidate={} possibleRoleIds={} resolvedRole={}",
                moduleCode,
                candidate,
                possibleRoleIds,
                resolvedRole.orElse(null));
        return resolvedRole;
    }

    private Optional<String> findConfiguredRoleId(String candidate, String moduleCode) {
        if (moduleRoleAuthorizationRepository.findByModuleCodeAndRoleId(moduleCode, candidate).isPresent()) {
            return Optional.of(candidate);
        }

        String lowerCandidate = candidate.toLowerCase(Locale.ROOT);
        return moduleRoleAuthorizationRepository.findAll().stream()
                .map(entity -> entity.getRole().getId())
                .filter(roleId -> roleId != null)
                .filter(roleId -> roleId.toLowerCase(Locale.ROOT).equals(lowerCandidate))
                .findFirst();
    }

}