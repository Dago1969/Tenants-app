package com.qtm.tenants.equipment.repository;

import com.qtm.tenants.equipment.entity.EquipmentTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository JPA per EquipmentTypeEntity.
 */
@Repository
public interface EquipmentTypeRepository extends JpaRepository<EquipmentTypeEntity, Long> {
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, Long id);
    Optional<EquipmentTypeEntity> findByCode(String code);
    List<EquipmentTypeEntity> findByCodeContainingIgnoreCaseAndNameContainingIgnoreCaseAndStatusContainingIgnoreCase(
            String code,
            String name,
            String status
    );
}
