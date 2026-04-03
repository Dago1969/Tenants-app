package com.qtm.tenants.authorization;

import com.qtm.commonlib.dto.ProjectDto;
import com.qtm.commonlib.dto.UserDto;
import com.qtm.tenants.authorization.dto.AuthorizationFieldDto;
import com.qtm.tenants.authorization.dto.AuthorizationFunctionDto;
import com.qtm.tenants.authorization.dto.AuthorizationModuleDto;
import com.qtm.tenants.authorization.dto.AuthorizationRoleMatrixDto;
import com.qtm.tenants.authorization.dto.AuthorizationUpdateRequestDto;
import com.qtm.tenants.authorization.entity.FunctionModuleRoleAuthorizationEntity;
import com.qtm.tenants.authorization.repository.FunctionModuleRoleAuthorizationRepository;
import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.function.entity.FunctionEntity;
import com.qtm.tenants.function.repository.FunctionRepository;
import com.qtm.tenants.doctor.entity.DoctorEntity;
import com.qtm.tenants.module.entity.ModuleEntity;
import com.qtm.tenants.module.repository.ModuleRepository;
import com.qtm.tenants.nurse.entity.NurseEntity;
import com.qtm.tenants.patient.entity.PatientEntity;
import com.qtm.tenants.role.entity.RoleEntity;
import com.qtm.tenants.role.repository.RoleRepository;
import com.qtm.tenants.structure.entity.StructureEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service di gestione matrice autorizzazioni per ruolo con raggruppamento per modulo.
 */
@Service
@RequiredArgsConstructor
public class AuthorizationManagementService {

    private static final List<String> DEFAULT_COMMON_FUNCTION_CODES = List.of(
            ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE,
            ControllerFunctionAuthorizationService.READ_FUNCTION_CODE,
            ControllerFunctionAuthorizationService.SEARCH_FUNCTION_CODE,
            ControllerFunctionAuthorizationService.UPDATE_FUNCTION_CODE,
            ControllerFunctionAuthorizationService.DELETE_FUNCTION_CODE
    );

    private static final List<String> TENANT_FIELDS = List.of(
            "clientCode",
            "clientName",
            "tenantAppUrl",
            "enabled"
    );

    private static final Map<String, ModuleDefinition> MODULE_DEFINITIONS = List.of(
            new ModuleDefinition(
                    "USER",
                    "Utenti",
                    "user",
                    resolveEntityFields(UserDto.class, Set.of("id", "password", "clientId"), Map.of()),
                    List.of()
            ),
            new ModuleDefinition(
                    "PATIENT",
                    "Pazienti",
                    "patient",
                    resolveEntityFields(PatientEntity.class, Set.of("id"), Map.of()),
                    List.of()
            ),
            new ModuleDefinition(
                    "DOCTOR",
                    "Dottori",
                    "doctor",
                    resolveEntityFields(DoctorEntity.class, Set.of("id"), Map.of()),
                    List.of()
            ),
            new ModuleDefinition(
                    "NURSE",
                    "Infermieri",
                    "nurse",
                    resolveEntityFields(NurseEntity.class, Set.of("id"), Map.of()),
                    List.of()
            ),
            // --- INIZIO AGGIUNTA BLOCCO HOSPITAL ---
            new ModuleDefinition(
                    "HOSPITAL",
                    "Ospedali",
                    "hospital",
                    resolveEntityFields(
                        com.qtm.tenants.hospital.entity.HospitalEntity.class,
                        Set.of("id", "referents", "linkedHospitals"),
                        Map.of()
                    ),
                    DEFAULT_COMMON_FUNCTION_CODES
            ),
            new ModuleDefinition(
                    "STRUCTURE-FARMACY-O",
                    "Farmacie Ospedaliere",
                    "structure",
                    resolveEntityFields(StructureEntity.class, Set.of("id"), Map.of()),
                    List.of()
            ),
            new ModuleDefinition(
                    "STRUCTURE-FARMACY-R",
                    "Farmacie Retail",
                    "structure",
                    resolveEntityFields(StructureEntity.class, Set.of("id"), Map.of()),
                    List.of()
            ),
            new ModuleDefinition("ROLE", "Ruoli", "role", resolveEntityFields(RoleEntity.class, Set.of(), Map.of()), List.of()),
            new ModuleDefinition("MODULE", "Moduli", "module", resolveEntityFields(ModuleEntity.class, Set.of(), Map.of()), List.of()),
            new ModuleDefinition("FUNCTION", "Funzioni", "function", resolveEntityFields(FunctionEntity.class, Set.of(), Map.of()), List.of()),
            new ModuleDefinition("STRUCTURE", "Strutture", "structure", resolveEntityFields(StructureEntity.class, Set.of("id"), Map.of()), List.of()),
            new ModuleDefinition("PROJECT", "Progetti", "project", resolveEntityFields(ProjectDto.class, Set.of("id"), Map.of()), DEFAULT_COMMON_FUNCTION_CODES),
            new ModuleDefinition("TENANT", "Tenants", "tenant", TENANT_FIELDS, DEFAULT_COMMON_FUNCTION_CODES)
    ).stream().collect(Collectors.toMap(ModuleDefinition::code, definition -> definition, (left, right) -> right, LinkedHashMap::new));

    private final RoleRepository roleRepository;
    private final FunctionRepository functionRepository;
    private final ModuleRepository moduleRepository;
    private final ModuleRoleAuthorizationRepository moduleRoleAuthorizationRepository;
    private final FieldAuthorizationRepository fieldAuthorizationRepository;
    private final FunctionModuleRoleAuthorizationRepository functionModuleRoleAuthorizationRepository;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @Transactional(readOnly = true)
    public AuthorizationRoleMatrixDto getRoleMatrix(String roleId) {
        RoleEntity role = findRole(roleId);
        Map<String, FunctionEntity> functionsByCode = functionRepository.findAll().stream()
                .collect(Collectors.toMap(FunctionEntity::getCode, function -> function, (left, right) -> left, LinkedHashMap::new));

        List<ModuleEntity> allModules = moduleRepository.findAll();
        List<AuthorizationModuleDto> modules = allModules.stream()
                .map(moduleEntity -> {
                    // Se esiste una definizione statica, usala per entityName, fields, functions
                    ModuleDefinition definition = MODULE_DEFINITIONS.get(moduleEntity.getCode());
                    if (definition != null) {
                        return toModuleDto(role, definition, functionsByCode);
                    }
                    // Altrimenti crea un AuthorizationModuleDto minimale
                    return new AuthorizationModuleDto(
                            moduleEntity.getCode(),
                            moduleEntity.getName(),
                            "", // entityName
                            "allow", // default authorization
                            List.of(),
                            List.of()
                    );
                })
                .toList();
        return new AuthorizationRoleMatrixDto(role.getId(), modules);
    }

    @Transactional
    public AuthorizationRoleMatrixDto updateRoleMatrix(String roleId, AuthorizationUpdateRequestDto request) {
        RoleEntity role = findRole(roleId);
        Map<String, FunctionEntity> functionsByCode = functionRepository.findAll().stream()
                .collect(Collectors.toMap(FunctionEntity::getCode, function -> function, (left, right) -> left, LinkedHashMap::new));
        List<AuthorizationModuleDto> requestedModules = request == null || request.getModules() == null
                ? List.of()
                : request.getModules();

                for (AuthorizationModuleDto requestedModule : requestedModules) {
                        ModuleDefinition definition = MODULE_DEFINITIONS.get(requestedModule.getModuleCode());
                        AuthorizationScope moduleScope = parseModuleScope(requestedModule.getModuleAuthorization());
                        ModuleEntity module;
                        ModuleRoleAuthorizationEntity moduleRoleAuthorization;
                        if (definition != null) {
                                module = ensureModule(definition);
                                moduleRoleAuthorization = ensureModuleRoleAuthorization(module, role, moduleScope);
                                if (moduleRoleAuthorization.getAuthorization() != moduleScope) {
                                        moduleRoleAuthorization.setAuthorization(moduleScope);
                                        moduleRoleAuthorization = moduleRoleAuthorizationRepository.save(moduleRoleAuthorization);
                                }
                                updateFieldAuthorizations(definition, moduleRoleAuthorization, requestedModule.getFields());
                                updateFunctionAuthorizations(definition, role, module, functionsByCode, requestedModule.getFunctions());
                        } else {
                                // Modulo dinamico: gestisci solo il livello modulo
                                module = moduleRepository.findById(requestedModule.getModuleCode())
                                                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Modulo non trovato: " + requestedModule.getModuleCode()));
                                moduleRoleAuthorization = ensureModuleRoleAuthorization(module, role, moduleScope);
                                if (moduleRoleAuthorization.getAuthorization() != moduleScope) {
                                        moduleRoleAuthorization.setAuthorization(moduleScope);
                                        moduleRoleAuthorizationRepository.save(moduleRoleAuthorization);
                                }
                                // Ignora fields e functions
                        }
                }

        return getRoleMatrix(roleId);
    }

        @Transactional
        public void initializeRoleAuthorizations(String targetRoleId, String sourceRoleId) {
                AuthorizationUpdateRequestDto request = new AuthorizationUpdateRequestDto();
                if (sourceRoleId != null && !sourceRoleId.isBlank()) {
                        AuthorizationRoleMatrixDto sourceMatrix = getRoleMatrix(sourceRoleId);
                        request.setModules(sourceMatrix.getModules().stream()
                                        .map(this::copyModuleAuthorization)
                                        .toList());
                        updateRoleMatrix(targetRoleId, request);
                        return;
                }

                request.setModules(MODULE_DEFINITIONS.values().stream()
                                .map(this::buildDefaultDeniedModule)
                                .toList());
                updateRoleMatrix(targetRoleId, request);
        }

    private void updateFieldAuthorizations(
            ModuleDefinition definition,
            ModuleRoleAuthorizationEntity moduleRoleAuthorization,
            List<AuthorizationFieldDto> requestedFields
    ) {
        Map<String, FieldAuthorizationEntity> existingByField = fieldAuthorizationRepository
                .findAllByModuleRoleAuthorizationAndEntityName(moduleRoleAuthorization, definition.entityName()).stream()
                .collect(Collectors.toMap(FieldAuthorizationEntity::getFieldName, entity -> entity, (left, right) -> right, LinkedHashMap::new));

        List<AuthorizationFieldDto> safeRequestedFields = requestedFields == null ? List.of() : requestedFields;
        for (AuthorizationFieldDto requestedField : safeRequestedFields) {
            if (!definition.fields().contains(requestedField.getFieldName())) {
                throw new ResponseStatusException(
                        BAD_REQUEST,
                        "Campo non supportato per modulo " + definition.code() + ": " + requestedField.getFieldName()
                );
            }

            AuthorizationScope fieldScope = parseFieldScope(requestedField.getAuthorization());
            FieldAuthorizationEntity current = existingByField.get(requestedField.getFieldName());
            if (current == null) {
                FieldAuthorizationEntity created = new FieldAuthorizationEntity();
                created.setModuleRoleAuthorization(moduleRoleAuthorization);
                created.setEntityName(definition.entityName());
                created.setFieldName(requestedField.getFieldName());
                created.setAuthorization(fieldScope);
                fieldAuthorizationRepository.save(created);
                continue;
            }

            current.setAuthorization(fieldScope);
            fieldAuthorizationRepository.save(current);
        }
    }

    private void updateFunctionAuthorizations(
            ModuleDefinition definition,
            RoleEntity role,
            ModuleEntity module,
            Map<String, FunctionEntity> functionsByCode,
            List<AuthorizationFunctionDto> requestedFunctions
    ) {
        Set<String> supportedFunctionCodes = resolveSupportedFunctionCodes(definition)
                .stream()
                .collect(Collectors.toSet());
        List<AuthorizationFunctionDto> safeRequestedFunctions = requestedFunctions == null ? List.of() : requestedFunctions;

        for (AuthorizationFunctionDto requestedFunction : safeRequestedFunctions) {
            if (!supportedFunctionCodes.contains(requestedFunction.getFunctionCode())) {
                throw new ResponseStatusException(
                        BAD_REQUEST,
                        "Funzione non supportata per modulo " + definition.code() + ": " + requestedFunction.getFunctionCode()
                );
            }

            FunctionEntity function = functionsByCode.get(requestedFunction.getFunctionCode());
            if (function == null) {
                throw new ResponseStatusException(
                        BAD_REQUEST,
                        "Funzione non supportata per modulo " + definition.code() + ": " + requestedFunction.getFunctionCode()
                );
            }

            AuthorizationScope functionScope = parseFunctionScope(requestedFunction.getAuthorization());
            FunctionModuleRoleAuthorizationEntity currentFunctionAuthorization = functionModuleRoleAuthorizationRepository
                    .findByRoleIdAndModuleCodeAndFunctionCode(role.getId(), module.getCode(), function.getCode())
                    .orElseGet(() -> {
                        FunctionModuleRoleAuthorizationEntity created = new FunctionModuleRoleAuthorizationEntity();
                        created.setRole(role);
                        created.setModule(module);
                        created.setFunction(function);
                        return created;
                    });

            currentFunctionAuthorization.setAuthorization(functionScope);
            functionModuleRoleAuthorizationRepository.save(currentFunctionAuthorization);
        }
    }

    private AuthorizationModuleDto toModuleDto(
            RoleEntity role,
            ModuleDefinition definition,
            Map<String, FunctionEntity> functionsByCode
    ) {
        Optional<ModuleEntity> module = moduleRepository.findById(definition.code());
        Optional<ModuleRoleAuthorizationEntity> moduleRoleAuthorization = module
                .flatMap(currentModule -> moduleRoleAuthorizationRepository.findByModuleCodeAndRoleId(currentModule.getCode(), role.getId()));

        AuthorizationScope moduleScope = moduleRoleAuthorization
                .map(ModuleRoleAuthorizationEntity::getAuthorization)
                .filter(java.util.Objects::nonNull)
                .orElse(AuthorizationScope.ALLOW);

        Map<String, AuthorizationScope> fieldScopes = moduleRoleAuthorization
                .map(currentAuthorization -> fieldAuthorizationRepository
                        .findAllByModuleRoleAuthorizationAndEntityName(currentAuthorization, definition.entityName()).stream()
                        .collect(Collectors.toMap(
                                FieldAuthorizationEntity::getFieldName,
                                FieldAuthorizationEntity::getAuthorization,
                                (left, right) -> right,
                                LinkedHashMap::new
                        )))
                .orElseGet(LinkedHashMap::new);

        // Rileva nuovi campi entity non ancora presenti tra le autorizzazioni e aggiungili con default full-edit
        List<AuthorizationFieldDto> fields = definition.fields().stream()
                .map(field -> {
                    String auth = fieldScopes.containsKey(field)
                        ? fieldScopes.get(field).getCode()
                        : AuthorizationScope.FULL_EDIT.getCode();
                    return new AuthorizationFieldDto(field, auth);
                })
                .toList();

        Map<String, AuthorizationScope> functionScopes = module
                .map(currentModule -> functionModuleRoleAuthorizationRepository
                        .findAllByRoleIdAndModuleCode(role.getId(), currentModule.getCode()).stream()
                        .collect(Collectors.toMap(
                                entity -> entity.getFunction().getCode(),
                                FunctionModuleRoleAuthorizationEntity::getAuthorization,
                                (left, right) -> right,
                                LinkedHashMap::new
                        )))
                .orElseGet(LinkedHashMap::new);

        List<AuthorizationFunctionDto> functions = resolveSupportedFunctionCodes(definition).stream()
                .map(functionsByCode::get)
                .filter(java.util.Objects::nonNull)
                .map(function -> new AuthorizationFunctionDto(
                        function.getCode(),
                        function.getName(),
                        toFunctionAuthorizationCode(functionScopes.getOrDefault(function.getCode(), moduleScope)),
                        controllerFunctionAuthorizationService.isCommonFunctionCode(function.getCode())
                ))
                .toList();

        // Se fields o functions sono vuoti, popola comunque con i default dalla definizione statica
        List<AuthorizationFieldDto> safeFields = fields.isEmpty()
                ? definition.fields().stream().map(f -> new AuthorizationFieldDto(f, AuthorizationScope.FULL_EDIT.getCode())).toList()
                : fields;
        List<AuthorizationFunctionDto> safeFunctions = functions.isEmpty()
                ? resolveSupportedFunctionCodes(definition).stream()
                    .map(code -> new AuthorizationFunctionDto(
                        code,
                        code,
                        AuthorizationScope.ALLOW.getCode(),
                        controllerFunctionAuthorizationService.isCommonFunctionCode(code)
                    )).toList()
                : functions;

        return new AuthorizationModuleDto(
                definition.code(),
                module.map(ModuleEntity::getName).orElse(definition.name()),
                definition.entityName(),
                toModuleAuthorizationCode(moduleScope),
                safeFields,
                safeFunctions
        );
    }

    private RoleEntity findRole(String roleId) {
        return roleRepository.findById(roleId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Ruolo non trovato"));
    }

    private ModuleEntity ensureModule(ModuleDefinition definition) {
        return moduleRepository.findById(definition.code())
                                .map(existing -> {
                                        if (!definition.name().equals(existing.getName())) {
                                                existing.setName(definition.name());
                                                return moduleRepository.save(existing);
                                        }
                                        return existing;
                                })
                                .orElseGet(() -> {
                                        ModuleEntity module = new ModuleEntity();
                                        module.setCode(definition.code());
                                        module.setName(definition.name());
                                        return moduleRepository.save(module);
                                });
    }

    private ModuleRoleAuthorizationEntity ensureModuleRoleAuthorization(
            ModuleEntity module,
            RoleEntity role,
            AuthorizationScope fallbackScope
    ) {
        Optional<ModuleRoleAuthorizationEntity> existing = moduleRoleAuthorizationRepository
                .findByModuleCodeAndRoleId(module.getCode(), role.getId());
        if (existing.isPresent()) {
            ModuleRoleAuthorizationEntity current = existing.get();
            if (current.getAuthorization() == null) {
                current.setAuthorization(fallbackScope);
                return moduleRoleAuthorizationRepository.save(current);
            }
            return current;
        }

        ModuleRoleAuthorizationEntity created = new ModuleRoleAuthorizationEntity();
        created.setModule(module);
        created.setRole(role);
        created.setAuthorization(fallbackScope);
        return moduleRoleAuthorizationRepository.save(created);
    }

    private AuthorizationScope parseFieldScope(String code) {
        return parseScope(code, "scope campo");
    }

    private AuthorizationScope parseModuleScope(String code) {
        AuthorizationScope resolved = parseScope(code, "scope modulo");
        if (resolved == AuthorizationScope.ALLOW || resolved == AuthorizationScope.DENY) {
            return resolved;
        }
        return resolved.allowsModuleAccess() ? AuthorizationScope.ALLOW : AuthorizationScope.DENY;
    }

    private AuthorizationScope parseFunctionScope(String code) {
        AuthorizationScope resolved = parseScope(code, "scope funzione");
        return resolved.allowsFunctionExecution() ? AuthorizationScope.FULL_EDIT : AuthorizationScope.READ_ONLY;
    }

    private String toModuleAuthorizationCode(AuthorizationScope scope) {
        return scope.toModuleCode();
    }

    private String toFunctionAuthorizationCode(AuthorizationScope scope) {
        return scope.toFunctionCode();
    }

    private AuthorizationScope parseScope(String code, String fieldName) {
        try {
            return AuthorizationScope.fromCode(code);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, "Valore non valido per " + fieldName + ": " + code);
        }
    }

    private static List<String> resolveEntityFields(
            Class<?> entityClass,
            Set<String> excludedFields,
            Map<String, String> aliases
    ) {
        return Arrays.stream(entityClass.getDeclaredFields())
                .filter(field -> !Modifier.isStatic(field.getModifiers()))
                .map(field -> field.getName())
                .filter(fieldName -> !excludedFields.contains(fieldName))
                .map(fieldName -> aliases.getOrDefault(fieldName, fieldName))
                .toList();
    }

    private AuthorizationModuleDto copyModuleAuthorization(AuthorizationModuleDto sourceModule) {
        return new AuthorizationModuleDto(
                sourceModule.getModuleCode(),
                sourceModule.getModuleName(),
                sourceModule.getEntityName(),
                sourceModule.getModuleAuthorization(),
                sourceModule.getFields() == null ? List.of() : sourceModule.getFields().stream()
                        .map(field -> new AuthorizationFieldDto(field.getFieldName(), field.getAuthorization()))
                        .toList(),
                sourceModule.getFunctions() == null ? List.of() : sourceModule.getFunctions().stream()
                        .map(function -> new AuthorizationFunctionDto(
                                function.getFunctionCode(),
                                function.getFunctionName(),
                                function.getAuthorization(),
                                function.isCommonFunction()
                        ))
                        .toList()
        );
    }

    private AuthorizationModuleDto buildDefaultDeniedModule(ModuleDefinition definition) {
        return new AuthorizationModuleDto(
                definition.code(),
                definition.name(),
                definition.entityName(),
                AuthorizationScope.DENY.getCode(),
                definition.fields().stream()
                        .map(field -> new AuthorizationFieldDto(field, AuthorizationScope.HIDE_FIELD.getCode()))
                        .toList(),
                                resolveSupportedFunctionCodes(definition).stream()
                        .map(functionCode -> new AuthorizationFunctionDto(functionCode, functionCode, AuthorizationScope.DENY.getCode(), controllerFunctionAuthorizationService.isCommonFunctionCode(functionCode)))
                        .toList()
        );
    }

        private List<String> resolveSupportedFunctionCodes(ModuleDefinition definition) {
                List<String> supportedFunctionCodes = getSupportedFunctionCodesSafely(definition.code());
                if (!supportedFunctionCodes.isEmpty()) {
                        return supportedFunctionCodes;
                }
                return definition.defaultFunctionCodes();
        }

        private List<String> getSupportedFunctionCodesSafely(String moduleCode) {
                try {
                        return controllerFunctionAuthorizationService.getSupportedFunctionCodes(moduleCode);
                } catch (ResponseStatusException exception) {
                        if (exception.getStatusCode().value() == NOT_FOUND.value()) {
                                return List.of();
                        }
                        throw exception;
                }
        }

        private record ModuleDefinition(
                        String code,
                        String name,
                        String entityName,
                        List<String> fields,
                        List<String> defaultFunctionCodes
        ) {
    }
}
