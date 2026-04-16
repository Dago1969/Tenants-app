package com.qtm.tenants.equipment.repository;

import com.qtm.tenants.equipment.entity.EquipmentTypeEntity;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
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

    @Query("""
        SELECT equipmentType
        FROM EquipmentTypeEntity equipmentType
        WHERE LOWER(equipmentType.code) LIKE LOWER(CONCAT('%', :code, '%'))
          AND LOWER(equipmentType.name) LIKE LOWER(CONCAT('%', :name, '%'))
          AND (:status = '' OR LOWER(COALESCE(equipmentType.status, '')) LIKE LOWER(CONCAT('%', :status, '%')))
        ORDER BY equipmentType.code ASC
        """)
    List<EquipmentTypeEntity> searchByFilters(
        @Param("code") String code,
        @Param("name") String name,
        @Param("status") String status
    );
}
