package com.qtm.tenants.structure.repository;

import com.qtm.tenants.structure.entity.StructureTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository del catalogo tipi struttura persistiti a database.
 */
public interface StructureTypeRepository extends JpaRepository<StructureTypeEntity, String> {

    List<StructureTypeEntity> findAllByOrderByDisplayOrderAscCodeAsc();

    boolean existsByParentTypeCode(String parentTypeCode);
}