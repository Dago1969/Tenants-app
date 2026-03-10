package com.qtm.tenants.authorization;

import com.qtm.tenants.module.entity.ModuleEntity;
import com.qtm.tenants.module.repository.ModuleRepository;
import com.qtm.tenants.role.entity.RoleEntity;
import com.qtm.tenants.role.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Bootstrap dati di autorizzazione: moduli applicativi, regole modulo+ruolo e regole campo.
 */
@Component
@RequiredArgsConstructor
@Order(10)
public class AuthorizationBootstrap implements CommandLineRunner {

    private static final String MODULE_PATIENT = "PATIENT";
    private static final String MODULE_DOCTOR = "DOCTOR";
    private static final String MODULE_NURSE = "NURSE";
    private static final String MODULE_FUNCTION = "FUNCTION";
    private static final List<String> MODULE_CODES = List.of("USER", "STRUCTURE", "ROLE", "MODULE", MODULE_FUNCTION, MODULE_PATIENT, MODULE_DOCTOR, MODULE_NURSE);
    private static final String ENTITY_PATIENT = "patient";
    private static final String ENTITY_DOCTOR = "doctor";
    private static final String ENTITY_NURSE = "nurse";

    private static final List<String> PATIENT_FIELDS = List.of(
            "assistedId", "firstName", "lastName", "fiscalCode", "email", "primaryPhone", "secondaryPhone",
            "region", "province", "deliveryAddress", "secondaryAddresses", "communicationChannels",
            "identificationDocumentReference", "dataProcessingConsent", "dataProcessingConsentDateTime",
            "dataProcessingConsentRevocationLog", "additionalConsents", "therapyStatus", "prescribingSpecialist",
            "referenceHospitalStructure", "referencePharmacy", "preferredPickupPharmacy", "deliveryMode",
            "reminderEnabled", "caregiverFullName", "caregiverPhone", "preferredContact", "structureId"
    );

            private static final List<String> DOCTOR_FIELDS = List.of(
                "doctorFlyerId", "fullName", "email", "primaryPhone", "secondaryPhone",
                "region", "province", "deliveryAddress", "secondaryAddresses", "structureId",
                "specialization", "dataProcessingConsent", "dataProcessingConsentDateTime",
                "dataProcessingConsentRevocationLog", "additionalConsents"
            );

            private static final List<String> NURSE_FIELDS = List.of(
                "nurseProjectId", "fullName", "email", "primaryPhone", "secondaryPhone",
                "region", "province", "coverageArea", "referenceProvider", "professionalRegister", "enabled"
            );

    private final ModuleRepository moduleRepository;
    private final RoleRepository roleRepository;
    private final ModuleRoleAuthorizationRepository moduleRoleAuthorizationRepository;
    private final FieldAuthorizationRepository fieldAuthorizationRepository;

    @Override
    @Transactional
    public void run(String... args) {
        Map<String, ModuleEntity> modulesByCode = MODULE_CODES.stream()
                .map(this::ensureModule)
                .collect(Collectors.toMap(ModuleEntity::getCode, Function.identity()));

        List<RoleEntity> roles = roleRepository.findAll();
        for (RoleEntity role : roles) {
            boolean adminRole = isAdminRole(role.getId());
            for (String moduleCode : MODULE_CODES) {
                ModuleRoleAuthorizationEntity moduleRoleAuthorization = ensureModuleRoleAuthorization(
                        modulesByCode.get(moduleCode),
                        role,
                        adminRole ? AuthorizationScope.FULL_EDIT : AuthorizationScope.READ_ONLY
                );
                if (MODULE_PATIENT.equals(moduleCode)) {
                    ensurePatientFieldAuthorizations(moduleRoleAuthorization, adminRole);
                }
                if (MODULE_DOCTOR.equals(moduleCode)) {
                    ensureDoctorFieldAuthorizations(moduleRoleAuthorization, adminRole);
                }
                if (MODULE_NURSE.equals(moduleCode)) {
                    ensureNurseFieldAuthorizations(moduleRoleAuthorization, adminRole);
                }
            }
        }
    }

    private ModuleEntity ensureModule(String moduleCode) {
        return moduleRepository.findById(moduleCode)
                .orElseGet(() -> {
                    ModuleEntity module = new ModuleEntity();
                    module.setCode(moduleCode);
                    module.setName(moduleCode);
                    return moduleRepository.save(module);
                });
    }

    private ModuleRoleAuthorizationEntity ensureModuleRoleAuthorization(
            ModuleEntity module,
            RoleEntity role,
            AuthorizationScope defaultScope
    ) {
        Optional<ModuleRoleAuthorizationEntity> existing = moduleRoleAuthorizationRepository
                .findByModuleCodeAndRoleId(module.getCode(), role.getId());
        if (existing.isPresent()) {
            ModuleRoleAuthorizationEntity entity = existing.get();
            if (entity.getAuthorization() == null) {
                entity.setAuthorization(defaultScope);
                return moduleRoleAuthorizationRepository.save(entity);
            }
            return entity;
        }

        ModuleRoleAuthorizationEntity created = new ModuleRoleAuthorizationEntity();
        created.setModule(module);
        created.setRole(role);
        created.setAuthorization(defaultScope);
        return moduleRoleAuthorizationRepository.save(created);
    }

    private void ensurePatientFieldAuthorizations(
            ModuleRoleAuthorizationEntity moduleRoleAuthorization,
            boolean adminRole
    ) {
        Map<String, FieldAuthorizationEntity> existingByField = fieldAuthorizationRepository
                .findAllByModuleRoleAuthorizationModuleCodeAndModuleRoleAuthorizationRoleIdAndEntityName(
                        MODULE_PATIENT,
                        moduleRoleAuthorization.getRole().getId(),
                        ENTITY_PATIENT
                ).stream().collect(Collectors.toMap(FieldAuthorizationEntity::getFieldName, Function.identity()));

        for (String field : PATIENT_FIELDS) {
            if (existingByField.containsKey(field)) {
                continue;
            }

            FieldAuthorizationEntity fieldAuthorization = new FieldAuthorizationEntity();
            fieldAuthorization.setModuleRoleAuthorization(moduleRoleAuthorization);
            fieldAuthorization.setEntityName(ENTITY_PATIENT);
            fieldAuthorization.setFieldName(field);
            fieldAuthorization.setAuthorization(defaultPatientFieldScope(adminRole, field));
            fieldAuthorizationRepository.save(fieldAuthorization);
        }
    }

    private AuthorizationScope defaultPatientFieldScope(boolean adminRole, String field) {
        if (adminRole) {
            return AuthorizationScope.FULL_EDIT;
        }
        if ("dataProcessingConsentRevocationLog".equals(field)
                || "identificationDocumentReference".equals(field)) {
            return AuthorizationScope.HIDE_FIELD;
        }
        return AuthorizationScope.READ_ONLY;
    }

    private void ensureDoctorFieldAuthorizations(
            ModuleRoleAuthorizationEntity moduleRoleAuthorization,
            boolean adminRole
    ) {
        Map<String, FieldAuthorizationEntity> existingByField = fieldAuthorizationRepository
                .findAllByModuleRoleAuthorizationModuleCodeAndModuleRoleAuthorizationRoleIdAndEntityName(
                        MODULE_DOCTOR,
                        moduleRoleAuthorization.getRole().getId(),
                        ENTITY_DOCTOR
                ).stream().collect(Collectors.toMap(FieldAuthorizationEntity::getFieldName, Function.identity()));

        for (String field : DOCTOR_FIELDS) {
            if (existingByField.containsKey(field)) {
                continue;
            }

            FieldAuthorizationEntity fieldAuthorization = new FieldAuthorizationEntity();
            fieldAuthorization.setModuleRoleAuthorization(moduleRoleAuthorization);
            fieldAuthorization.setEntityName(ENTITY_DOCTOR);
            fieldAuthorization.setFieldName(field);
            fieldAuthorization.setAuthorization(defaultDoctorFieldScope(adminRole, field));
            fieldAuthorizationRepository.save(fieldAuthorization);
        }
    }

    private AuthorizationScope defaultDoctorFieldScope(boolean adminRole, String field) {
        if (adminRole) {
            return AuthorizationScope.FULL_EDIT;
        }
        if ("dataProcessingConsentRevocationLog".equals(field)) {
            return AuthorizationScope.HIDE_FIELD;
        }
        return AuthorizationScope.READ_ONLY;
    }

    private void ensureNurseFieldAuthorizations(
            ModuleRoleAuthorizationEntity moduleRoleAuthorization,
            boolean adminRole
    ) {
        Map<String, FieldAuthorizationEntity> existingByField = fieldAuthorizationRepository
                .findAllByModuleRoleAuthorizationModuleCodeAndModuleRoleAuthorizationRoleIdAndEntityName(
                        MODULE_NURSE,
                        moduleRoleAuthorization.getRole().getId(),
                        ENTITY_NURSE
                ).stream().collect(Collectors.toMap(FieldAuthorizationEntity::getFieldName, Function.identity()));

        for (String field : NURSE_FIELDS) {
            if (existingByField.containsKey(field)) {
                continue;
            }

            FieldAuthorizationEntity fieldAuthorization = new FieldAuthorizationEntity();
            fieldAuthorization.setModuleRoleAuthorization(moduleRoleAuthorization);
            fieldAuthorization.setEntityName(ENTITY_NURSE);
            fieldAuthorization.setFieldName(field);
            fieldAuthorization.setAuthorization(defaultNurseFieldScope(adminRole));
            fieldAuthorizationRepository.save(fieldAuthorization);
        }
    }

    private AuthorizationScope defaultNurseFieldScope(boolean adminRole) {
        if (adminRole) {
            return AuthorizationScope.FULL_EDIT;
        }
        return AuthorizationScope.READ_ONLY;
    }

    private boolean isAdminRole(String roleId) {
        String normalized = roleId == null ? "" : roleId.toLowerCase(Locale.ROOT);
        return normalized.contains("admin") || normalized.contains("owner") || normalized.contains("super");
    }
}
