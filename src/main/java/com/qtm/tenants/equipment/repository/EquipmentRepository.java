package com.qtm.tenants.equipment.repository;

import com.qtm.tenants.equipment.entity.EquipmentEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository JPA per EquipmentEntity.
 */
@Repository
public interface EquipmentRepository extends JpaRepository<EquipmentEntity, Long> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    @Override
    @EntityGraph(attributePaths = "equipmentType")
    Optional<EquipmentEntity> findById(Long id);

    @Query("""
        SELECT equipment
        FROM EquipmentEntity equipment
        JOIN FETCH equipment.equipmentType equipmentType
        WHERE LOWER(equipment.code) LIKE LOWER(CONCAT('%', :code, '%'))
          AND (:equipmentTypeId IS NULL OR equipmentType.id = :equipmentTypeId)
          AND (:status = '' OR LOWER(COALESCE(equipment.status, '')) = LOWER(:status))
          AND (:serialNumber = '' OR LOWER(COALESCE(equipment.serialNumber, '')) LIKE LOWER(CONCAT('%', :serialNumber, '%')))
        ORDER BY equipment.code ASC, equipment.id ASC
        """)
    List<EquipmentEntity> searchByFilters(
            @Param("code") String code,
            @Param("equipmentTypeId") Long equipmentTypeId,
            @Param("status") String status,
            @Param("serialNumber") String serialNumber
    );
}