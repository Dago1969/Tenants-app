package com.qtm.tenants.structure.repository;

import com.qtm.tenants.structure.entity.StructureEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository strutture.
 */
public interface StructureRepository extends JpaRepository<StructureEntity, Long> {

        List<StructureEntity> findAllByStructureTypeOrderByNameAsc(String structureType);

    List<StructureEntity> findAllByStructureTypeAndParentStructureIdOrderByNameAsc(
            String structureType,
            Long parentStructureId
    );

    List<StructureEntity> findAllByParentStructureIdOrderByNameAsc(Long parentStructureId);

    Optional<StructureEntity> findByCode(String code);
}
