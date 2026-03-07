package com.qtm.tenants.role.service;

import com.qtm.tenants.role.dto.RoleDto;
import com.qtm.tenants.role.entity.RoleEntity;
import com.qtm.tenants.role.mapper.RoleMapper;
import com.qtm.tenants.role.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service orchestratore CRUD ruoli.
 */
@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;

    @Transactional
    public RoleDto create(RoleDto roleDto) {
        RoleEntity saved = roleRepository.save(roleMapper.toEntity(roleDto));
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
        current.setDescription(roleDto.getDescription());
        return roleMapper.toDto(roleRepository.save(current));
    }

    @Transactional
    public void delete(String id) {
        roleRepository.delete(findEntityById(id));
    }

    private RoleEntity findEntityById(String id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Ruolo non trovato"));
    }
}
