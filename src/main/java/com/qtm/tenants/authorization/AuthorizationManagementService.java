package com.qtm.tenants.authorization;

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
import com.qtm.tenants.medic.entity.MedicEntity;
import com.qtm.tenants.module.entity.ModuleEntity;
import com.qtm.tenants.module.repository.ModuleRepository;
import com.qtm.tenants.nurse.entity.NurseEntity;
import com.qtm.tenants.patient.entity.PatientEntity;
import com.qtm.tenants.role.entity.RoleEntity;
import com.qtm.tenants.role.repository.RoleRepository;
import com.qtm.tenants.structure.entity.StructureEntity;
import com.qtm.tenants.user.entity.UserEntity;
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

    private static final Map<String, ModuleDefinition> MODULE_DEFINITIONS = List.of(
            new ModuleDefinition(
                    "USER",
                    "Utenti",
                    "user",
                    resolveEntityFields(UserEntity.class, Set.of("id"), Map.of("role", "roleId"))
            ),
            new ModuleDefinition(
                    "PATIENT",
                    "Pazienti",
                    "patient",
                    resolveEntityFields(PatientEntity.class, Set.of("id"), Map.of())
            ),
            new ModuleDefinition(
                    "MEDIC",
                    "Medici",
                    "medic",
                    resolveEntityFields(MedicEntity.class, Set.of("id"), Map.of())
            ),
            new ModuleDefinition(
                    "NURSE",
                    "Infermieri",
                    "nurse",
                    resolveEntityFields(NurseEntity.class, Set.of("id"), Map.of())
            ),
            new ModuleDefinition("ROLE", "Ruoli", "role", resolveEntityFields(RoleEntity.class, Set.of(), Map.of())),
            new ModuleDefinition("MODULE", "Moduli", "module", resolveEntityFields(ModuleEntity.class, Set.of(), Map.of())),
            new ModuleDefinition("FUNCTION", "Funzioni", "function", resolveEntityFields(FunctionEntity.class, Set.of(), Map.of())),
            new ModuleDefinition("STRUCTURE", "Strutture", "structure", resolveEntityFields(StructureEntity.class, Set.of("id"), Map.of()))
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

        List<AuthorizationModuleDto> modules = MODULE_DEFINITIONS.values().stream()
                .map(definition -> toModuleDto(role, definition, functionsByCode))
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
            if (definition == null) {
                throw new ResponseStatusException(BAD_REQUEST, "Modulo non supportato: " + requestedModule.getModuleCode());
            }

            AuthorizationScope moduleScope = parseModuleScope(requestedModule.getModuleAuthorization());
            ModuleEntity module = ensureModule(definition);
            ModuleRoleAuthorizationEntity moduleRoleAuthorization = ensureModuleRoleAuthorization(module, role, moduleScope);
            if (moduleRoleAuthorization.getAuthorization() != moduleScope) {
                moduleRoleAuthorization.setAuthorization(moduleScope);
                moduleRoleAuthorization = moduleRoleAuthorizationRepository.save(moduleRoleAuthorization);
            }

            updateFieldAuthorizations(definition, moduleRoleAuthorization, requestedModule.getFields());
            updateFunctionAuthorizations(definition, role, module, functionsByCode, requestedModule.getFunctions());
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
        Set<String> supportedFunctionCodes = controllerFunctionAuthorizationService.getSupportedFunctionCodes(definition.code())
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
        ModuleEntity module = ensureModule(definition);
        ModuleRoleAuthorizationEntity moduleRoleAuthorization = ensureModuleRoleAuthorization(module, role, AuthorizationScope.ALLOW);

        Map<String, AuthorizationScope> fieldScopes = fieldAuthorizationRepository
                .findAllByModuleRoleAuthorizationAndEntityName(moduleRoleAuthorization, definition.entityName()).stream()
                .collect(Collectors.toMap(
                        FieldAuthorizationEntity::getFieldName,
                        FieldAuthorizationEntity::getAuthorization,
                        (left, right) -> right,
                        LinkedHashMap::new
                ));

        List<AuthorizationFieldDto> fields = definition.fields().stream()
                .map(field -> new AuthorizationFieldDto(
                        field,
                        fieldScopes.getOrDefault(field, AuthorizationScope.FULL_EDIT).getCode()
                ))
                .toList();

        Map<String, AuthorizationScope> functionScopes = functionModuleRoleAuthorizationRepository
                .findAllByRoleIdAndModuleCode(role.getId(), module.getCode()).stream()
                .collect(Collectors.toMap(
                        entity -> entity.getFunction().getCode(),
                        FunctionModuleRoleAuthorizationEntity::getAuthorization,
                        (left, right) -> right,
                        LinkedHashMap::new
                ));

        List<AuthorizationFunctionDto> functions = controllerFunctionAuthorizationService.getSupportedFunctionCodes(definition.code()).stream()
                .map(functionsByCode::get)
                .filter(java.util.Objects::nonNull)
                .map(function -> new AuthorizationFunctionDto(
                        function.getCode(),
                        function.getName(),
                        toFunctionAuthorizationCode(functionScopes.getOrDefault(function.getCode(), moduleRoleAuthorization.getAuthorization())),
                        controllerFunctionAuthorizationService.isCommonFunctionCode(function.getCode())
                ))
                .toList();

        return new AuthorizationModuleDto(
                definition.code(),
                module.getName(),
                definition.entityName(),
                toModuleAuthorizationCode(moduleRoleAuthorization.getAuthorization()),
                fields,
                functions
        );
    }

    private RoleEntity findRole(String roleId) {
        return roleRepository.findById(roleId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Ruolo non trovato"));
    }

    private ModuleEntity ensureModule(ModuleDefinition definition) {
        return moduleRepository.findById(definition.code())
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
                controllerFunctionAuthorizationService.getSupportedFunctionCodes(definition.code()).stream()
                        .map(functionCode -> new AuthorizationFunctionDto(functionCode, functionCode, AuthorizationScope.DENY.getCode(), controllerFunctionAuthorizationService.isCommonFunctionCode(functionCode)))
                        .toList()
        );
    }

    private record ModuleDefinition(String code, String name, String entityName, List<String> fields) {
    }
}
