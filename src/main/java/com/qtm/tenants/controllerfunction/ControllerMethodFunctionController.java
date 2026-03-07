package com.qtm.tenants.controllerfunction;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller REST di configurazione dei metodi esposti controller per modulo.
 */
@RestController
@RequestMapping("/api/tenants/controller-function-mappings")
@RequiredArgsConstructor
public class ControllerMethodFunctionController {

    private final ControllerMethodFunctionService controllerMethodFunctionService;

    @GetMapping
    public ResponseEntity<List<ControllerMethodFunctionModuleDto>> getAll() {
        return ResponseEntity.ok(controllerMethodFunctionService.getAllModuleConfigurations());
    }

    @GetMapping("/modules/{moduleCode}")
    public ResponseEntity<ControllerMethodFunctionModuleDto> getByModuleCode(@PathVariable String moduleCode) {
        return ResponseEntity.ok(controllerMethodFunctionService.getModuleConfiguration(moduleCode));
    }

    @PutMapping("/modules/{moduleCode}")
    public ResponseEntity<ControllerMethodFunctionModuleDto> updateByModuleCode(
            @PathVariable String moduleCode,
            @RequestBody ControllerMethodFunctionUpdateRequestDto request
    ) {
        return ResponseEntity.ok(controllerMethodFunctionService.updateModuleConfiguration(moduleCode, request));
    }
}
