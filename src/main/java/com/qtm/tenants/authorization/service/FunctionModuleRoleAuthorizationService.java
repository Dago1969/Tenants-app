package com.qtm.tenants.authorization.service;

import com.qtm.tenants.authorization.AuthorizationScope;
import com.qtm.tenants.authorization.dto.FunctionModuleRoleAuthorizationDto;
import com.qtm.tenants.authorization.entity.FunctionModuleRoleAuthorizationEntity;
import com.qtm.tenants.authorization.mapper.FunctionModuleRoleAuthorizationMapper;
import com.qtm.tenants.authorization.repository.FunctionModuleRoleAuthorizationRepository;
import com.qtm.tenants.function.entity.FunctionEntity;
import com.qtm.tenants.function.repository.FunctionRepository;
import com.qtm.tenants.module.entity.ModuleEntity;
import com.qtm.tenants.module.repository.ModuleRepository;
import com.qtm.tenants.role.entity.RoleEntity;
import com.qtm.tenants.role.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service per gestione autorizzazioni funzioni-modulo-ruolo.
 */
@Service
@RequiredArgsConstructor
public class FunctionModuleRoleAuthorizationService {
    private final FunctionModuleRoleAuthorizationRepository repository;
    private final FunctionModuleRoleAuthorizationMapper mapper;
    private final FunctionRepository functionRepository;
    private final ModuleRepository moduleRepository;
    private final RoleRepository roleRepository;

    @Transactional(readOnly = true)
    public List<FunctionModuleRoleAuthorizationDto> findAll() {
        return repository.findAll().stream().map(mapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public FunctionModuleRoleAuthorizationDto findById(Long id) {
        return mapper.toDto(findEntityById(id));
    }

    @Transactional
    public FunctionModuleRoleAuthorizationDto save(FunctionModuleRoleAuthorizationDto dto) {
        ResolvedAuthorization resolvedAuthorization = resolveAuthorization(dto);
        FunctionModuleRoleAuthorizationEntity entity = repository
            .findByRoleIdAndModuleCodeAndFunctionCode(
                resolvedAuthorization.role().getId(),
                resolvedAuthorization.module().getCode(),
                resolvedAuthorization.function().getCode()
            )
            .orElseGet(FunctionModuleRoleAuthorizationEntity::new);

        applyResolvedAuthorization(entity, resolvedAuthorization);
        return mapper.toDto(repository.save(entity));
    }

    @Transactional
    public FunctionModuleRoleAuthorizationDto update(Long id, FunctionModuleRoleAuthorizationDto dto) {
        FunctionModuleRoleAuthorizationEntity entity = findEntityById(id);
        ResolvedAuthorization resolvedAuthorization = resolveAuthorization(dto);

        FunctionModuleRoleAuthorizationEntity existingEntity = repository
            .findByRoleIdAndModuleCodeAndFunctionCode(
                resolvedAuthorization.role().getId(),
                resolvedAuthorization.module().getCode(),
                resolvedAuthorization.function().getCode()
            )
            .filter(current -> !current.getId().equals(id))
            .orElse(null);

        if (existingEntity != null) {
            applyResolvedAuthorization(existingEntity, resolvedAuthorization);
            repository.delete(entity);
            return mapper.toDto(repository.save(existingEntity));
        }

        applyResolvedAuthorization(entity, resolvedAuthorization);
        return mapper.toDto(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public List<FunctionModuleRoleAuthorizationDto> findByRoleId(String roleId) {
        return repository.findAllByRoleId(roleId).stream().map(mapper::toDto).toList();
    }

    private ResolvedAuthorization resolveAuthorization(FunctionModuleRoleAuthorizationDto dto) {
        return new ResolvedAuthorization(
                findFunction(dto.getFunctionCode()),
                findModule(dto.getModuleCode()),
                findRole(dto.getRoleId()),
                parseScope(dto.getAuthorization())
        );
    }

    private void applyResolvedAuthorization(
            FunctionModuleRoleAuthorizationEntity entity,
            ResolvedAuthorization resolvedAuthorization
    ) {
        entity.setFunction(resolvedAuthorization.function());
        entity.setModule(resolvedAuthorization.module());
        entity.setRole(resolvedAuthorization.role());
        entity.setAuthorization(resolvedAuthorization.authorization());
    }

    private FunctionModuleRoleAuthorizationEntity findEntityById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Autorizzazione funzione non trovata"));
    }

    private FunctionEntity findFunction(String code) {
        return functionRepository.findById(code)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Funzione non trovata"));
    }

    private ModuleEntity findModule(String code) {
        return moduleRepository.findById(code)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Modulo non trovato"));
    }

    private RoleEntity findRole(String id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Ruolo non trovato"));
    }

    private AuthorizationScope parseScope(String code) {
        try {
            return AuthorizationScope.fromCode(code);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, "Valore autorizzazione non valido: " + code);
        }
    }

    private record ResolvedAuthorization(
            FunctionEntity function,
            ModuleEntity module,
            RoleEntity role,
            AuthorizationScope authorization
    ) {
    }
}
