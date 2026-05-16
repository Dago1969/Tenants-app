package com.qtm.tenants.appointment.repository;

import com.qtm.tenants.appointment.entity.AppointmentTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository JPA per i tipi di appuntamento.
 */
@Repository
public interface AppointmentTypeRepository extends JpaRepository<AppointmentTypeEntity, Long> {
}
