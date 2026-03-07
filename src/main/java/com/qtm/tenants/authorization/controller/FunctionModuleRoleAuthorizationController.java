package com.qtm.tenants.authorization.controller;

import com.qtm.tenants.authorization.dto.FunctionModuleRoleAuthorizationDto;
import com.qtm.tenants.authorization.service.FunctionModuleRoleAuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST per autorizzazioni funzioni-modulo-ruolo.
 */
@RestController
@RequestMapping({"/api/tenants/authorization-functions", "/api/authorization-functions"})
@RequiredArgsConstructor
public class FunctionModuleRoleAuthorizationController {
    private final FunctionModuleRoleAuthorizationService service;

    @GetMapping
    public List<FunctionModuleRoleAuthorizationDto> getAll() {
        return service.findAll();
    }

    @PostMapping
    public FunctionModuleRoleAuthorizationDto save(@RequestBody FunctionModuleRoleAuthorizationDto dto) {
        return service.save(dto);
    }

    @GetMapping("/{id}")
    public FunctionModuleRoleAuthorizationDto getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public FunctionModuleRoleAuthorizationDto update(@PathVariable Long id, @RequestBody FunctionModuleRoleAuthorizationDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/role/{roleId}")
    public List<FunctionModuleRoleAuthorizationDto> getByRole(@PathVariable String roleId) {
        return service.findByRoleId(roleId);
    }
}
