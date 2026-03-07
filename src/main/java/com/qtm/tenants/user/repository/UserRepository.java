package com.qtm.tenants.user.repository;

import com.qtm.tenants.user.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository utenti.
 */
public interface UserRepository extends JpaRepository<UserEntity, Long> {
}
