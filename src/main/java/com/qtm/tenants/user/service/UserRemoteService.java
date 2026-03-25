package com.qtm.tenants.user.service;

import com.qtm.commonlib.dto.UserDto;
import com.qtm.tenants.user.client.UserRemoteClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

/**
 * Service che si occupa di orchestrare le chiamate al repository remoto utenti (QTMDB).
 * Implementa le stesse firme del vecchio UserService locale, ma delega tutto al client REST remoto.
 */
@Service
@RequiredArgsConstructor
public class UserRemoteService {
    private final UserRemoteClient userRemoteClient;

    public UserDto create(UserDto userDto) {
        return userRemoteClient.create(userDto);
    }

    public List<UserDto> findAll() {
        return userRemoteClient.findAll();
    }

    public List<UserDto> search(String username, String email, String roleId, Long structureId, Boolean enabled) {
        return userRemoteClient.search(username, email, roleId, structureId, enabled);
    }

    public UserDto findById(Long id) {
        return userRemoteClient.findById(id);
    }

    public UserDto update(Long id, UserDto userDto) {
        return userRemoteClient.update(id, userDto);
    }

    public void delete(Long id) {
        userRemoteClient.delete(id);
    }
}
