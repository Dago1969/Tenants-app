package com.qtm.tenants.controllerfunction;

import com.qtm.tenants.function.entity.FunctionEntity;
import com.qtm.tenants.function.repository.FunctionRepository;
import com.qtm.tenants.function.controller.FunctionController;
import com.qtm.tenants.doctor.controller.DoctorController;
import com.qtm.tenants.module.controller.ModuleController;
import com.qtm.tenants.module.entity.ModuleEntity;
import com.qtm.tenants.module.repository.ModuleRepository;
import com.qtm.tenants.nurse.controller.NurseController;
import com.qtm.tenants.patient.controller.PatientController;
import com.qtm.tenants.role.controller.RoleController;
import com.qtm.tenants.structure.controller.StructureController;
import com.qtm.tenants.user.controller.UserController;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service di configurazione persistente dei metodi esposti dai controller verso le funzioni autorizzabili.
 */
@Service
@RequiredArgsConstructor
public class ControllerMethodFunctionService {

    public static final String CREATE_FUNCTION_CODE = "CREATE";
    public static final String READ_FUNCTION_CODE = "READ";
    public static final String SEARCH_FUNCTION_CODE = "SEARCH";
    public static final String UPDATE_FUNCTION_CODE = "UPDATE";
    public static final String DELETE_FUNCTION_CODE = "DELETE";
    public static final String APPROVE_FUNCTION_CODE = "APPROVE";

    private static final Pattern CAMEL_CASE_SPLIT = Pattern.compile("(?<!^)([A-Z])");

    private static final List<String> COMMON_FUNCTION_CODES = List.of(
            CREATE_FUNCTION_CODE,
            READ_FUNCTION_CODE,
            SEARCH_FUNCTION_CODE,
            UPDATE_FUNCTION_CODE,
            DELETE_FUNCTION_CODE
    );

        private static final Set<String> EXCLUDED_METHOD_NAMES = Set.of("getFieldPermissions");

    private static final List<String> FUNCTION_DISPLAY_ORDER = List.of(
            CREATE_FUNCTION_CODE,
            READ_FUNCTION_CODE,
            UPDATE_FUNCTION_CODE,
            DELETE_FUNCTION_CODE,
            SEARCH_FUNCTION_CODE,
            APPROVE_FUNCTION_CODE
    );

        private static final Map<String, Class<?>> MODULE_CONTROLLERS = Map.of(
            "USER", UserController.class,
            "PATIENT", PatientController.class,
            "DOCTOR", DoctorController.class,
            "NURSE", NurseController.class,
            "ROLE", RoleController.class,
            "MODULE", ModuleController.class,
            "FUNCTION", FunctionController.class,
            "STRUCTURE", StructureController.class
    );

    private static final Map<String, String> DEFAULT_METHOD_FUNCTION_CODES = buildDefaultMethodFunctionCodes();

    private final ControllerMethodFunctionRepository controllerMethodFunctionRepository;
    private final ControllerMethodFunctionMapper controllerMethodFunctionMapper;
    private final FunctionRepository functionRepository;
    private final ModuleRepository moduleRepository;

    @Transactional
    public List<ControllerMethodFunctionModuleDto> getAllModuleConfigurations() {
        synchronizeAllModules();
        return MODULE_CONTROLLERS.keySet().stream()
                .sorted()
                .map(this::getModuleConfiguration)
                .toList();
    }

    @Transactional
    public ControllerMethodFunctionModuleDto getModuleConfiguration(String moduleCode) {
        synchronizeModuleMethods(moduleCode);
        return buildModuleDto(moduleCode);
    }

    @Transactional
    public ControllerMethodFunctionModuleDto updateModuleConfiguration(
            String moduleCode,
            ControllerMethodFunctionUpdateRequestDto request
    ) {
        synchronizeModuleMethods(moduleCode);
        Set<String> exposedMethods = discoverExposedMethodNames(moduleCode);
        List<ControllerMethodFunctionDto> requestedMethods = request == null || request.getMethods() == null
                ? List.of()
                : request.getMethods();

        for (ControllerMethodFunctionDto requestedMethod : requestedMethods) {
            String methodName = normalizeRequiredValue(requestedMethod.getMethodName(), "Nome metodo obbligatorio");
            if (!exposedMethods.contains(methodName)) {
                throw new ResponseStatusException(
                        BAD_REQUEST,
                        "Metodo non esposto per il modulo " + moduleCode + ": " + methodName
                );
            }

            String functionCode = normalizeFunctionCode(requestedMethod.getFunctionCode());
            ensureFunctionExists(functionCode);
            ControllerMethodFunctionEntity entity = controllerMethodFunctionRepository
                    .findByModuleCodeAndMethodName(moduleCode, methodName)
                    .orElseGet(ControllerMethodFunctionEntity::new);
            entity.setModuleCode(moduleCode);
            entity.setMethodName(methodName);
            entity.setFunctionCode(functionCode);
            controllerMethodFunctionRepository.save(entity);
        }

        synchronizeModuleMethods(moduleCode);
        return buildModuleDto(moduleCode);
    }

    @Transactional(readOnly = true)
    public List<String> getSupportedFunctionCodes(String moduleCode) {
        return controllerMethodFunctionRepository.findAllByModuleCodeOrderByMethodNameAsc(moduleCode).stream()
                .map(ControllerMethodFunctionEntity::getFunctionCode)
                .distinct()
                .sorted(this::compareFunctionCodes)
                .toList();
    }

    public boolean isCommonFunctionCode(String functionCode) {
        return COMMON_FUNCTION_CODES.contains(functionCode);
    }

    @Transactional
    public void synchronizeAllModules() {
        MODULE_CONTROLLERS.keySet().forEach(this::synchronizeModuleMethods);
    }

    @Transactional
    public void synchronizeModuleMethods(String moduleCode) {
        Class<?> controllerClass = getControllerClass(moduleCode);
        List<String> exposedMethods = Arrays.stream(controllerClass.getDeclaredMethods())
                .filter(this::isRequestHandlerMethod)
                .map(Method::getName)
            .filter(methodName -> !EXCLUDED_METHOD_NAMES.contains(methodName))
                .sorted()
                .toList();

        if (!exposedMethods.isEmpty()) {
            controllerMethodFunctionRepository.deleteAllByModuleCodeAndMethodNameNotIn(moduleCode, exposedMethods);
        }

        for (String methodName : exposedMethods) {
            ControllerMethodFunctionEntity entity = controllerMethodFunctionRepository
                    .findByModuleCodeAndMethodName(moduleCode, methodName)
                    .orElseGet(ControllerMethodFunctionEntity::new);
            entity.setModuleCode(moduleCode);
            entity.setMethodName(methodName);
            if (entity.getFunctionCode() == null || entity.getFunctionCode().isBlank()) {
                entity.setFunctionCode(resolveDefaultFunctionCode(methodName));
            }
            ensureFunctionExists(entity.getFunctionCode());
            controllerMethodFunctionRepository.save(entity);
        }
    }

    private ControllerMethodFunctionModuleDto buildModuleDto(String moduleCode) {
        Map<String, FunctionEntity> functionsByCode = functionRepository.findAll().stream()
                .collect(Collectors.toMap(FunctionEntity::getCode, function -> function, (left, right) -> left, LinkedHashMap::new));

        List<ControllerMethodFunctionDto> allMethods = controllerMethodFunctionRepository.findAllByModuleCodeOrderByMethodNameAsc(moduleCode).stream()
                .map(entity -> controllerMethodFunctionMapper.toDto(
                        entity,
                        resolveFunctionName(entity.getFunctionCode(), functionsByCode),
                        isCommonFunctionCode(entity.getFunctionCode())
                ))
                .sorted((left, right) -> left.getMethodName().compareToIgnoreCase(right.getMethodName()))
                .toList();

        List<ControllerMethodFunctionDto> commonMethods = allMethods.stream()
                .filter(ControllerMethodFunctionDto::isCommonFunction)
                .toList();
        List<ControllerMethodFunctionDto> customMethods = allMethods.stream()
                .filter(method -> !method.isCommonFunction())
                .toList();

        return new ControllerMethodFunctionModuleDto(
                moduleCode,
                resolveModuleName(moduleCode),
                commonMethods,
                customMethods
        );
    }

    private String resolveModuleName(String moduleCode) {
        return moduleRepository.findById(moduleCode)
                .map(ModuleEntity::getName)
                .orElse(moduleCode);
    }

    private String resolveFunctionName(String functionCode, Map<String, FunctionEntity> functionsByCode) {
        return Optional.ofNullable(functionsByCode.get(functionCode))
                .map(FunctionEntity::getName)
                .orElseGet(() -> toDisplayName(functionCode));
    }

    private void ensureFunctionExists(String functionCode) {
        String normalizedFunctionCode = normalizeFunctionCode(functionCode);
        functionRepository.findById(normalizedFunctionCode)
                .orElseGet(() -> {
                    FunctionEntity function = new FunctionEntity();
                    function.setCode(normalizedFunctionCode);
                    function.setName(toDisplayName(normalizedFunctionCode));
                    return functionRepository.save(function);
                });
    }

    private Set<String> discoverExposedMethodNames(String moduleCode) {
        return Arrays.stream(getControllerClass(moduleCode).getDeclaredMethods())
                .filter(this::isRequestHandlerMethod)
                .map(Method::getName)
            .filter(methodName -> !EXCLUDED_METHOD_NAMES.contains(methodName))
                .collect(Collectors.toSet());
    }

    private Class<?> getControllerClass(String moduleCode) {
        Class<?> controllerClass = MODULE_CONTROLLERS.get(moduleCode);
        if (controllerClass == null) {
            throw new ResponseStatusException(NOT_FOUND, "Modulo non registrato per la configurazione controller: " + moduleCode);
        }
        return controllerClass;
    }

    private boolean isRequestHandlerMethod(Method method) {
        return method.isAnnotationPresent(GetMapping.class)
                || method.isAnnotationPresent(PostMapping.class)
                || method.isAnnotationPresent(PutMapping.class)
                || method.isAnnotationPresent(DeleteMapping.class)
                || method.isAnnotationPresent(PatchMapping.class)
                || method.isAnnotationPresent(RequestMapping.class);
    }

    private String resolveDefaultFunctionCode(String methodName) {
        return DEFAULT_METHOD_FUNCTION_CODES.getOrDefault(methodName, camelToUpperSnake(methodName));
    }

    private int compareFunctionCodes(String left, String right) {
        int leftIndex = FUNCTION_DISPLAY_ORDER.indexOf(left);
        int rightIndex = FUNCTION_DISPLAY_ORDER.indexOf(right);
        if (leftIndex == -1 && rightIndex == -1) {
            return left.compareToIgnoreCase(right);
        }
        if (leftIndex == -1) {
            return 1;
        }
        if (rightIndex == -1) {
            return -1;
        }
        return Integer.compare(leftIndex, rightIndex);
    }

    private String normalizeRequiredValue(String value, String errorMessage) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, errorMessage);
        }
        return value.trim();
    }

    private String normalizeFunctionCode(String functionCode) {
        return normalizeRequiredValue(functionCode, "Codice funzione obbligatorio")
                .trim()
                .toUpperCase(Locale.ROOT);
    }

    private static Map<String, String> buildDefaultMethodFunctionCodes() {
        Map<String, String> mapping = new LinkedHashMap<>();
        mapping.put("create", CREATE_FUNCTION_CODE);
        mapping.put("findById", READ_FUNCTION_CODE);
        mapping.put("read", READ_FUNCTION_CODE);
        mapping.put("findAll", SEARCH_FUNCTION_CODE);
        mapping.put("findByCode", SEARCH_FUNCTION_CODE);
        mapping.put("search", SEARCH_FUNCTION_CODE);
        mapping.put("update", UPDATE_FUNCTION_CODE);
        mapping.put("delete", DELETE_FUNCTION_CODE);
        mapping.put("approve", APPROVE_FUNCTION_CODE);
        return Map.copyOf(mapping);
    }

    private String camelToUpperSnake(String value) {
        return CAMEL_CASE_SPLIT.matcher(value)
                .replaceAll("_$1")
                .toUpperCase(Locale.ROOT);
    }

    private String toDisplayName(String code) {
        return Arrays.stream(code.split("_"))
                .filter(part -> !part.isBlank())
                .map(part -> part.charAt(0) + part.substring(1).toLowerCase(Locale.ROOT))
                .collect(Collectors.joining(" "));
    }
}
