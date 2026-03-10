package com.qtm.tenants.doctor.service;

import com.qtm.tenants.authorization.AuthorizationScope;
import com.qtm.tenants.authorization.FieldAuthorizationEntity;
import com.qtm.tenants.authorization.FieldAuthorizationRepository;
import com.qtm.tenants.authorization.ModuleRoleAuthorizationEntity;
import com.qtm.tenants.authorization.ModuleRoleAuthorizationRepository;
import com.qtm.tenants.doctor.dto.DoctorDto;
import com.qtm.tenants.doctor.entity.DoctorEntity;
import com.qtm.tenants.doctor.mapper.DoctorMapper;
import com.qtm.tenants.doctor.repository.DoctorRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service orchestratore CRUD dottori con applicazione policy di visibilita campi per ruolo.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorService {

    private static final String DOCTOR_ID_PREFIX = "DOC-";
    private static final String MODULE_CODE = "DOCTOR";
    private static final String ENTITY_NAME = "doctor";

    private static final Set<String> PROTECTED_FIELDS = Set.of(
            "doctorFlyerId", "fullName", "email", "primaryPhone", "secondaryPhone",
            "regionId", "region", "provinceId", "province", "cityId", "city", "deliveryAddress", "secondaryAddresses", "structureId",
            "specialization", "dataProcessingConsent", "dataProcessingConsentDateTime",
            "dataProcessingConsentRevocationLog", "additionalConsents"
    );

    private final DoctorRepository doctorRepository;
    private final DoctorMapper doctorMapper;
    private final ModuleRoleAuthorizationRepository moduleRoleAuthorizationRepository;
    private final FieldAuthorizationRepository fieldAuthorizationRepository;

    @Transactional
    public DoctorDto create(DoctorDto doctorDto) {
        AuthorizationPolicy policy = resolveAuthorizationPolicy();
        enforceModuleWriteAllowed(policy);
        enforceFieldWriteAllowed(doctorDto, null, policy.fieldScopes());

        DoctorEntity saved = doctorRepository.save(doctorMapper.toEntity(doctorDto));

        if (saved.getDoctorFlyerId() == null || saved.getDoctorFlyerId().isBlank()) {
            saved.setDoctorFlyerId(buildDoctorFlyerId(saved.getId()));
            saved = doctorRepository.save(saved);
        }

        return applyReadAuthorization(doctorMapper.toDto(saved), policy);
    }

    @Transactional(readOnly = true)
    public List<DoctorDto> findAll() {
        AuthorizationPolicy policy = resolveAuthorizationPolicy();
        enforceModuleReadAllowed(policy);
        return doctorRepository.findAll().stream()
                .map(doctorMapper::toDto)
                .map(dto -> applyReadAuthorization(dto, policy))
                .toList();
    }

    @Transactional(readOnly = true)
    public DoctorDto findById(Long id) {
        AuthorizationPolicy policy = resolveAuthorizationPolicy();
        enforceModuleReadAllowed(policy);
        return applyReadAuthorization(doctorMapper.toDto(findEntityById(id)), policy);
    }

    @Transactional(readOnly = true)
    public Map<String, String> getFieldAuthorizationsForCurrentRole() {
        AuthorizationPolicy policy = resolveAuthorizationPolicy();
        enforceModuleReadAllowed(policy);

        Map<String, String> permissions = PROTECTED_FIELDS.stream().collect(Collectors.toMap(
                field -> field,
                field -> policy.fieldScopes().getOrDefault(field, AuthorizationScope.FULL_EDIT).getCode(),
                (left, right) -> right,
                LinkedHashMap::new
        ));

        log.info("AUTHZ_PAGE_ACCESS module={} role={} moduleScope={} permissions={}",
                MODULE_CODE,
                policy.roleId(),
                policy.moduleScope().getCode(),
                permissions);
        return permissions;
    }

    @Transactional
    public DoctorDto update(Long id, DoctorDto doctorDto) {
        AuthorizationPolicy policy = resolveAuthorizationPolicy();
        enforceModuleWriteAllowed(policy);

        DoctorEntity current = findEntityById(id);
        DoctorDto currentDto = doctorMapper.toDto(current);
        enforceFieldWriteAllowed(doctorDto, currentDto, policy.fieldScopes());

        current.setDoctorFlyerId(doctorDto.getDoctorFlyerId());
        current.setFullName(doctorDto.getFullName());
        current.setEmail(doctorDto.getEmail());
        current.setPrimaryPhone(doctorDto.getPrimaryPhone());
        current.setSecondaryPhone(doctorDto.getSecondaryPhone());
        current.setRegionId(doctorDto.getRegionId());
        current.setRegion(doctorDto.getRegion());
        current.setProvinceId(doctorDto.getProvinceId());
        current.setProvince(doctorDto.getProvince());
        current.setCityId(doctorDto.getCityId());
        current.setCity(doctorDto.getCity());
        current.setDeliveryAddress(doctorDto.getDeliveryAddress());
        current.setSecondaryAddresses(doctorDto.getSecondaryAddresses());
        current.setStructureId(doctorDto.getStructureId());
        current.setSpecialization(doctorDto.getSpecialization());
        current.setDataProcessingConsent(doctorDto.getDataProcessingConsent());
        current.setDataProcessingConsentDateTime(doctorDto.getDataProcessingConsentDateTime());
        current.setDataProcessingConsentRevocationLog(doctorDto.getDataProcessingConsentRevocationLog());
        current.setAdditionalConsents(doctorDto.getAdditionalConsents());

        return applyReadAuthorization(doctorMapper.toDto(doctorRepository.save(current)), policy);
    }

    @Transactional
    public void delete(Long id) {
        AuthorizationPolicy policy = resolveAuthorizationPolicy();
        enforceModuleWriteAllowed(policy);
        doctorRepository.delete(findEntityById(id));
    }

    private String buildDoctorFlyerId(Long id) {
        return DOCTOR_ID_PREFIX + String.format("%06d", id);
    }

    private DoctorEntity findEntityById(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Dottore non trovato"));
    }

    private AuthorizationPolicy resolveAuthorizationPolicy() {
        Optional<String> roleId = resolveCurrentRoleId();
        if (roleId.isEmpty()) {
            log.warn("AUTHZ_ROLE_RESOLUTION module={} role not resolved from authentication, fallback to full-edit", MODULE_CODE);
            return AuthorizationPolicy.allowAll();
        }

        ModuleRoleAuthorizationEntity moduleRole = moduleRoleAuthorizationRepository
                .findByModuleCodeAndRoleId(MODULE_CODE, roleId.get())
                .orElseThrow(() -> new ResponseStatusException(
                        FORBIDDEN,
                        "Ruolo senza autorizzazioni configurate per modulo DOCTOR"
                ));

        Map<String, AuthorizationScope> fieldScopes = fieldAuthorizationRepository
                .findAllByModuleRoleAuthorizationModuleCodeAndModuleRoleAuthorizationRoleIdAndEntityName(
                        MODULE_CODE,
                        roleId.get(),
                        ENTITY_NAME
                ).stream()
                .collect(Collectors.toMap(
                        FieldAuthorizationEntity::getFieldName,
                        FieldAuthorizationEntity::getAuthorization,
                        (left, right) -> right,
                        LinkedHashMap::new
                ));

        return new AuthorizationPolicy(roleId.get(), moduleRole.getAuthorization(), fieldScopes);
    }

    private Optional<String> resolveCurrentRoleId() {
        Optional<String> roleFromHeader = resolveRoleFromRequestHeader();
        if (roleFromHeader.isPresent()) {
            log.info("AUTHZ_ROLE_RESOLUTION module={} role resolved from header X-Selected-Role={}",
                    MODULE_CODE,
                    roleFromHeader.get());
            return roleFromHeader;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
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
                .filter(candidate -> candidate != null && !candidate.isBlank())
                .map(this::resolveConfiguredRoleId)
                .flatMap(Optional::stream)
                .findFirst();

        log.info("AUTHZ_ROLE_RESOLUTION module={} authorities={} candidates={} resolvedRole={}",
                MODULE_CODE,
                authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList(),
                candidates,
                resolvedRole.orElse("<not-found>"));
        return resolvedRole;
    }

    private Optional<String> resolveRoleFromRequestHeader() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return Optional.empty();
        }

        HttpServletRequest request = attributes.getRequest();
        String selectedRole = request.getHeader("X-Selected-Role");
        if (selectedRole == null || selectedRole.isBlank()) {
            return Optional.empty();
        }

        return toPossibleRoleIds(selectedRole.trim()).stream()
                .map(this::resolveConfiguredRoleId)
                .flatMap(Optional::stream)
                .findFirst();
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

    private Optional<String> resolveConfiguredRoleId(String candidate) {
        if (candidate == null || candidate.isBlank()) {
            return Optional.empty();
        }
        if (moduleRoleAuthorizationRepository.findByModuleCodeAndRoleId(MODULE_CODE, candidate).isPresent()) {
            return Optional.of(candidate);
        }
        String lowerCandidate = candidate.toLowerCase(Locale.ROOT);
        return moduleRoleAuthorizationRepository.findAll().stream()
                .map(entity -> entity.getRole().getId())
                .filter(roleId -> roleId != null)
                .filter(roleId -> roleId.toLowerCase(Locale.ROOT).equals(lowerCandidate))
                .findFirst();
    }

    private void enforceModuleReadAllowed(AuthorizationPolicy policy) {
        if (!policy.moduleScope().allowsModuleAccess()) {
            throw new ResponseStatusException(FORBIDDEN, "Ruolo non autorizzato alla visualizzazione modulo DOCTOR");
        }
    }

    private void enforceModuleWriteAllowed(AuthorizationPolicy policy) {
        if (!policy.moduleScope().allowsModuleAccess()) {
            throw new ResponseStatusException(FORBIDDEN, "Ruolo non autorizzato alla modifica modulo DOCTOR");
        }
    }

    private void enforceFieldWriteAllowed(
            DoctorDto requested,
            DoctorDto current,
            Map<String, AuthorizationScope> fieldScopes
    ) {
        BeanWrapper requestedWrapper = new BeanWrapperImpl(requested);
        BeanWrapper currentWrapper = current == null ? null : new BeanWrapperImpl(current);

        for (String field : PROTECTED_FIELDS) {
            AuthorizationScope scope = fieldScopes.getOrDefault(field, AuthorizationScope.FULL_EDIT);
            if (scope == AuthorizationScope.FULL_EDIT) {
                continue;
            }

            Object requestedValue = requestedWrapper.getPropertyValue(field);
            Object currentValue = currentWrapper == null ? null : currentWrapper.getPropertyValue(field);
            if (!java.util.Objects.equals(requestedValue, currentValue)) {
                throw new ResponseStatusException(
                        FORBIDDEN,
                        "Ruolo non autorizzato a modificare il campo doctor." + field
                );
            }
        }
    }

    private DoctorDto applyReadAuthorization(DoctorDto dto, AuthorizationPolicy policy) {
        if (policy.fieldScopes().isEmpty()) {
            return dto;
        }

        BeanWrapper wrapper = new BeanWrapperImpl(dto);
        policy.fieldScopes().forEach((field, scope) -> {
            if (scope == AuthorizationScope.HIDE_FIELD && wrapper.isWritableProperty(field)) {
                wrapper.setPropertyValue(field, null);
            }
        });
        return dto;
    }

    private record AuthorizationPolicy(String roleId, AuthorizationScope moduleScope, Map<String, AuthorizationScope> fieldScopes) {

        private static AuthorizationPolicy allowAll() {
            return new AuthorizationPolicy("<fallback>", AuthorizationScope.FULL_EDIT, Map.of());
        }
    }
}
