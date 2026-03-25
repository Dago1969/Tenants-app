package com.qtm.tenants.role.service;

import com.qtm.commonlib.dto.UserDto;
import com.qtm.tenants.authorization.AuthorizationManagementService;
import com.qtm.tenants.authorization.FieldAuthorizationRepository;
import com.qtm.tenants.authorization.ModuleRoleAuthorizationRepository;
import com.qtm.tenants.authorization.repository.FunctionModuleRoleAuthorizationRepository;
import com.qtm.tenants.role.dto.RoleDeleteCheckDto;
import com.qtm.tenants.role.dto.RoleDeleteLinkedUserDto;
import com.qtm.tenants.role.dto.RoleDto;
import com.qtm.tenants.role.entity.RoleEntity;
import com.qtm.tenants.role.mapper.RoleMapper;
import com.qtm.tenants.role.repository.RoleRepository;
import com.qtm.tenants.user.service.UserRemoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service orchestratore CRUD ruoli.
 */
@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;
    private final AuthorizationManagementService authorizationManagementService;
    private final ModuleRoleAuthorizationRepository moduleRoleAuthorizationRepository;
    private final FieldAuthorizationRepository fieldAuthorizationRepository;
    private final FunctionModuleRoleAuthorizationRepository functionModuleRoleAuthorizationRepository;
    private final UserRemoteService userRemoteService;

    @Transactional
    public RoleDto create(RoleDto roleDto) {
        RoleEntity saved = roleRepository.save(roleMapper.toEntity(roleDto));
        authorizationManagementService.initializeRoleAuthorizations(saved.getId(), roleDto.getSourceRoleId());
        return roleMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<RoleDto> findAll() {
        return roleRepository.findAll().stream().map(roleMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public RoleDto findById(String id) {
        return roleMapper.toDto(findEntityById(id));
    }

    @Transactional
    public RoleDto update(String id, RoleDto roleDto) {
        RoleEntity current = findEntityById(id);
        current.setName(roleDto.getName() == null || roleDto.getName().isBlank() ? roleDto.getDescription() : roleDto.getName());
        current.setDescription(roleDto.getDescription());
        return roleMapper.toDto(roleRepository.save(current));
    }

    @Transactional(readOnly = true)
    public RoleDeleteCheckDto getDeleteCheck(String id) {
        RoleEntity role = findEntityById(id);
        List<RoleDeleteLinkedUserDto> linkedUsers = userRemoteService.search(null, null, id, null, null).stream()
                .map(user -> new RoleDeleteLinkedUserDto(user.getId(), user.getUsername()))
                .toList();
        List<RoleDto> replacementRoles = roleRepository.findAll().stream()
                .filter(currentRole -> !currentRole.getId().equals(role.getId()))
                .map(roleMapper::toDto)
                .toList();
        return new RoleDeleteCheckDto(role.getId(), linkedUsers, replacementRoles);
    }

    @Transactional
    public void delete(String id, String replacementRoleId) {
        RoleEntity role = findEntityById(id);
        List<UserDto> linkedUsers = userRemoteService.search(null, null, id, null, null);
        if (!linkedUsers.isEmpty()) {
            if (replacementRoleId == null || replacementRoleId.isBlank()) {
                throw new ResponseStatusException(BAD_REQUEST, "Esistono utenti collegati al ruolo da cancellare");
            }
            if (id.equalsIgnoreCase(replacementRoleId)) {
                throw new ResponseStatusException(BAD_REQUEST, "Il nuovo ruolo deve essere diverso dal ruolo da cancellare");
            }
            findEntityById(replacementRoleId);
            linkedUsers.forEach(user -> {
                user.setRoleId(replacementRoleId);
                userRemoteService.update(user.getId(), user);
            });
        }

        functionModuleRoleAuthorizationRepository.deleteAllByRoleId(id);
        fieldAuthorizationRepository.deleteAllByModuleRoleAuthorizationRoleId(id);
        moduleRoleAuthorizationRepository.deleteAllByRoleId(id);
        roleRepository.delete(role);
    }

    private RoleEntity findEntityById(String id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Ruolo non trovato"));
    }
}
