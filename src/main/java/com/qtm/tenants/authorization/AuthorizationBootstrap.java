package com.qtm.tenants.authorization;

import com.qtm.tenants.equipment.dto.EquipmentDTO;
import com.qtm.tenants.equipment.dto.EquipmentTypeDTO;
import com.qtm.tenants.module.entity.ModuleEntity;
import com.qtm.tenants.module.repository.ModuleRepository;
import com.qtm.tenants.role.entity.RoleEntity;
import com.qtm.tenants.role.repository.RoleRepository;
import com.qtm.tenants.structure.StructureModuleCodes;
import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanDto;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Bootstrap dati di autorizzazione: moduli applicativi, regole modulo+ruolo e regole campo.
 */
@Component
@RequiredArgsConstructor
@Order(10)
public class AuthorizationBootstrap implements CommandLineRunner {

    private static final String MODULE_EQUIPMENT = "EQUIPMENT";
    private static final String MODULE_EQUIPMENT_TYPE = "EQUIPMENT_TYPE";
    private static final String MODULE_PATIENT = "PATIENT";
    private static final String MODULE_DOCTOR = "DOCTOR";
    private static final String MODULE_NURSE = "NURSE";
    private static final String MODULE_THERAPEUTIC_PLAN = "THERAPEUTIC_PLAN";
        private static final String MODULE_FUNCTION = "FUNCTION";
        private static final List<String> MODULE_CODES = Stream.of(
                List.of("USER"),
                StructureModuleCodes.AUTHORIZATION_MODULE_CODES,
            List.of("ROLE", "MODULE", MODULE_FUNCTION, MODULE_PATIENT, MODULE_DOCTOR, MODULE_NURSE, MODULE_THERAPEUTIC_PLAN, MODULE_EQUIPMENT, MODULE_EQUIPMENT_TYPE)
            )
            .flatMap(List::stream)
            .toList();
        private static final String ENTITY_EQUIPMENT = "equipment";
    private static final String ENTITY_EQUIPMENT_TYPE = "equipmentType";
    private static final String ENTITY_PATIENT = "patient";
    private static final String ENTITY_DOCTOR = "doctor";
    private static final String ENTITY_NURSE = "nurse";
    private static final String ENTITY_THERAPEUTIC_PLAN = "therapeuticPlan";
        private static final List<String> EQUIPMENT_FIELDS = resolveEntityFields(
            EquipmentDTO.class,
            Set.of("id", "equipmentTypeCode", "equipmentTypeName")
        );
    private static final List<String> EQUIPMENT_TYPE_FIELDS = resolveEntityFields(EquipmentTypeDTO.class, Set.of("id"));
    private static final List<String> THERAPEUTIC_PLAN_FIELDS = resolveEntityFields(
            TherapeuticPlanDto.class,
            Set.of("id", "patientDisplayName", "equipmentCodes", "structureName", "nurseName", "doctorName")
    );

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
                AuthorizationScope defaultScope = resolveDefaultModuleScope(moduleCode, adminRole);
                ModuleRoleAuthorizationEntity moduleRoleAuthorization = ensureModuleRoleAuthorization(
                        modulesByCode.get(moduleCode),
                        role,
                        defaultScope
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
                if (MODULE_THERAPEUTIC_PLAN.equals(moduleCode)) {
                    ensureTherapeuticPlanFieldAuthorizations(moduleRoleAuthorization, adminRole);
                }
                if (MODULE_EQUIPMENT.equals(moduleCode)) {
                    ensureEquipmentFieldAuthorizations(moduleRoleAuthorization, adminRole);
                }
                if (MODULE_EQUIPMENT_TYPE.equals(moduleCode)) {
                    ensureEquipmentTypeFieldAuthorizations(moduleRoleAuthorization, adminRole);
                }
            }
        }
    }

    private AuthorizationScope resolveDefaultModuleScope(String moduleCode, boolean adminRole) {
        if (StructureModuleCodes.BULK_IMPORT.equals(moduleCode)) {
            return adminRole ? AuthorizationScope.FULL_EDIT : AuthorizationScope.DENY;
        }

        return adminRole ? AuthorizationScope.FULL_EDIT : AuthorizationScope.READ_ONLY;
    }

    private ModuleEntity ensureModule(String moduleCode) {
        String resolvedModuleName = resolveModuleName(moduleCode);
        return moduleRepository.findById(Objects.requireNonNull(moduleCode, "moduleCode"))
                .map(existing -> {
                    if (!Objects.equals(existing.getName(), resolvedModuleName)) {
                        existing.setName(resolvedModuleName);
                        return moduleRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    ModuleEntity module = new ModuleEntity();
                    module.setCode(moduleCode);
                    module.setName(resolvedModuleName);
                    return moduleRepository.save(module);
                });
    }

    private String resolveModuleName(String moduleCode) {
        if (MODULE_EQUIPMENT.equals(moduleCode)) {
            return "Attrezzature";
        }
        if (MODULE_EQUIPMENT_TYPE.equals(moduleCode)) {
            return "Tipi Attrezzature";
        }
        if (MODULE_THERAPEUTIC_PLAN.equals(moduleCode)) {
            return "Piani Terapeutici";
        }
        return StructureModuleCodes.resolveModuleName(moduleCode);
    }

    private void ensureTherapeuticPlanFieldAuthorizations(
            ModuleRoleAuthorizationEntity moduleRoleAuthorization,
            boolean adminRole
    ) {
        Map<String, FieldAuthorizationEntity> existingByField = fieldAuthorizationRepository
                .findAllByModuleRoleAuthorizationModuleCodeAndModuleRoleAuthorizationRoleIdAndEntityName(
                        MODULE_THERAPEUTIC_PLAN,
                        moduleRoleAuthorization.getRole().getId(),
                        ENTITY_THERAPEUTIC_PLAN
                ).stream().collect(Collectors.toMap(FieldAuthorizationEntity::getFieldName, Function.identity()));

        for (String field : THERAPEUTIC_PLAN_FIELDS) {
            if (existingByField.containsKey(field)) {
                continue;
            }

            FieldAuthorizationEntity fieldAuthorization = new FieldAuthorizationEntity();
            fieldAuthorization.setModuleRoleAuthorization(moduleRoleAuthorization);
            fieldAuthorization.setEntityName(ENTITY_THERAPEUTIC_PLAN);
            fieldAuthorization.setFieldName(field);
            fieldAuthorization.setAuthorization(adminRole ? AuthorizationScope.FULL_EDIT : AuthorizationScope.READ_ONLY);
            fieldAuthorizationRepository.save(fieldAuthorization);
        }
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

    private void ensureEquipmentFieldAuthorizations(
            ModuleRoleAuthorizationEntity moduleRoleAuthorization,
            boolean adminRole
    ) {
        Map<String, FieldAuthorizationEntity> existingByField = fieldAuthorizationRepository
                .findAllByModuleRoleAuthorizationModuleCodeAndModuleRoleAuthorizationRoleIdAndEntityName(
                        MODULE_EQUIPMENT,
                        moduleRoleAuthorization.getRole().getId(),
                        ENTITY_EQUIPMENT
                ).stream().collect(Collectors.toMap(FieldAuthorizationEntity::getFieldName, Function.identity()));

        for (String field : EQUIPMENT_FIELDS) {
            if (existingByField.containsKey(field)) {
                continue;
            }

            FieldAuthorizationEntity fieldAuthorization = new FieldAuthorizationEntity();
            fieldAuthorization.setModuleRoleAuthorization(moduleRoleAuthorization);
            fieldAuthorization.setEntityName(ENTITY_EQUIPMENT);
            fieldAuthorization.setFieldName(field);
            fieldAuthorization.setAuthorization(defaultEquipmentFieldScope(adminRole));
            fieldAuthorizationRepository.save(fieldAuthorization);
        }
    }

    private AuthorizationScope defaultEquipmentFieldScope(boolean adminRole) {
        if (adminRole) {
            return AuthorizationScope.FULL_EDIT;
        }
        return AuthorizationScope.READ_ONLY;
    }

    private void ensureEquipmentTypeFieldAuthorizations(
            ModuleRoleAuthorizationEntity moduleRoleAuthorization,
            boolean adminRole
    ) {
        Map<String, FieldAuthorizationEntity> existingByField = fieldAuthorizationRepository
                .findAllByModuleRoleAuthorizationModuleCodeAndModuleRoleAuthorizationRoleIdAndEntityName(
                        MODULE_EQUIPMENT_TYPE,
                        moduleRoleAuthorization.getRole().getId(),
                        ENTITY_EQUIPMENT_TYPE
                ).stream().collect(Collectors.toMap(FieldAuthorizationEntity::getFieldName, Function.identity()));

        for (String field : EQUIPMENT_TYPE_FIELDS) {
            if (existingByField.containsKey(field)) {
                continue;
            }

            FieldAuthorizationEntity fieldAuthorization = new FieldAuthorizationEntity();
            fieldAuthorization.setModuleRoleAuthorization(moduleRoleAuthorization);
            fieldAuthorization.setEntityName(ENTITY_EQUIPMENT_TYPE);
            fieldAuthorization.setFieldName(field);
            fieldAuthorization.setAuthorization(defaultEquipmentTypeFieldScope(adminRole));
            fieldAuthorizationRepository.save(fieldAuthorization);
        }
    }

    private AuthorizationScope defaultEquipmentTypeFieldScope(boolean adminRole) {
        if (adminRole) {
            return AuthorizationScope.FULL_EDIT;
        }
        return AuthorizationScope.READ_ONLY;
    }

    private static List<String> resolveEntityFields(Class<?> entityClass, Set<String> excludedFields) {
        return Arrays.stream(entityClass.getDeclaredFields())
                .filter(field -> !Modifier.isStatic(field.getModifiers()))
                .map(field -> field.getName())
                .filter(fieldName -> !excludedFields.contains(fieldName))
                .toList();
    }

    private boolean isAdminRole(String roleId) {
        String normalized = roleId == null ? "" : roleId.toLowerCase(Locale.ROOT);
        return normalized.contains("admin") || normalized.contains("owner") || normalized.contains("super");
    }
}
