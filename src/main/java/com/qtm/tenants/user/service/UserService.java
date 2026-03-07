package com.qtm.tenants.user.service;

import com.qtm.tenants.role.entity.RoleEntity;
import com.qtm.tenants.role.repository.RoleRepository;
import com.qtm.tenants.user.dto.UserDto;
import com.qtm.tenants.user.entity.UserEntity;
import com.qtm.tenants.user.mapper.UserMapper;
import com.qtm.tenants.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service orchestratore CRUD utenti.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;

    @Transactional
    public UserDto create(UserDto userDto) {
        UserEntity entity = userMapper.toEntity(userDto);
        entity.setRole(findRoleById(userDto.getRoleId()));
        UserEntity saved = userRepository.save(entity);
        return userMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<UserDto> findAll() {
        return userRepository.findAll().stream().map(userMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<UserDto> search(String username, String roleId, Long structureId, Boolean enabled) {
        return userRepository.findAll().stream()
                .filter(user -> containsIgnoreCase(user.getUsername(), username))
                .filter(user -> containsIgnoreCase(user.getRole() == null ? null : user.getRole().getId(), roleId))
                .filter(user -> structureId == null || structureId.equals(user.getStructureId()))
                .filter(user -> enabled == null || user.isEnabled() == enabled)
                .map(userMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserDto findById(Long id) {
        return userMapper.toDto(findEntityById(id));
    }

    @Transactional
    public UserDto update(Long id, UserDto userDto) {
        UserEntity current = findEntityById(id);
        current.setUsername(userDto.getUsername());
        current.setEnabled(userDto.isEnabled());
        current.setRole(findRoleById(userDto.getRoleId()));
        current.setStructureId(userDto.getStructureId());
        return userMapper.toDto(userRepository.save(current));
    }

    @Transactional
    public void delete(Long id) {
        userRepository.delete(findEntityById(id));
    }

    private UserEntity findEntityById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Utente non trovato"));
    }

    private boolean containsIgnoreCase(String source, String filter) {
        if (filter == null || filter.isBlank()) {
            return true;
        }

        if (source == null) {
            return false;
        }

        return source.toLowerCase(Locale.ROOT).contains(filter.toLowerCase(Locale.ROOT));
    }

    private RoleEntity findRoleById(String roleId) {
        if (roleId == null || roleId.isBlank()) {
            return null;
        }

        return roleRepository.findById(roleId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Ruolo non trovato"));
    }
}
