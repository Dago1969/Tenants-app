package com.qtm.tenants.user.repository;

import com.qtm.tenants.user.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository utenti.
 */
public interface UserRepository extends JpaRepository<UserEntity, Long> {

	List<UserEntity> findAllByRoleId(String roleId);

	Optional<UserEntity> findByUsernameIgnoreCase(String username);
}
