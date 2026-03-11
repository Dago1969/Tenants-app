package com.qtm.tenants.user.service;

import com.qtm.tenants.role.entity.RoleEntity;
import com.qtm.tenants.role.repository.RoleRepository;
import com.qtm.tenants.user.dto.UserDto;
import com.qtm.tenants.user.entity.UserEntity;
import com.qtm.tenants.user.mapper.UserMapper;
import com.qtm.tenants.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Test del service utenti: verifica creazione e consultazione utente tenant.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, roleRepository, new UserMapper());
    }

    @Test
    void shouldCreateAndReadUser() {
        UserEntity saved = new UserEntity();
        saved.setId(1L);
        saved.setUsername("mrossi");
        saved.setEnabled(true);
        RoleEntity role = new RoleEntity();
        role.setId("ADMIN");
        saved.setRole(role);
        saved.setStructureId(2L);

        UserDto toCreate = new UserDto();
        toCreate.setUsername("mrossi");
        toCreate.setEnabled(true);
        toCreate.setRoleId("ADMIN");
        toCreate.setStructureId(2L);

        when(userRepository.save(any(UserEntity.class))).thenReturn(saved);
        when(userRepository.findById(1L)).thenReturn(Optional.of(saved));
        when(userRepository.findAll()).thenReturn(List.of(saved));
        when(userRepository.findByUsernameIgnoreCase("mrossi")).thenReturn(Optional.empty());
        when(roleRepository.findById("ADMIN")).thenReturn(Optional.of(role));

        UserDto created = userService.create(toCreate);
        UserDto loaded = userService.findById(1L);

        assertThat(created.getId()).isEqualTo(1L);
        assertThat(loaded.getUsername()).isEqualTo("mrossi");
        assertThat(userService.findAll()).hasSize(1);
    }

    @Test
    void shouldRejectDuplicateUsername() {
        UserEntity existing = new UserEntity();
        existing.setId(99L);
        existing.setUsername("mrossi");

        when(userRepository.findByUsernameIgnoreCase("mrossi")).thenReturn(Optional.of(existing));

        UserDto toCreate = new UserDto();
        toCreate.setUsername("mrossi");
        toCreate.setEnabled(true);

        assertThatThrownBy(() -> userService.create(toCreate))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Username gia presente: mrossi");
    }
}
