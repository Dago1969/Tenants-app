package com.qtm.tenants.hospital.repository;

import com.qtm.tenants.hospital.entity.HospitalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

/**
 * Repository ospedali dedicata.
 */
public interface HospitalRepository extends JpaRepository<HospitalEntity, Long> {
    List<HospitalEntity> findAllByStatusOrderByNameAsc(Integer status);
    Optional<HospitalEntity> findByCode(String code);
    boolean existsByCode(String code);
}