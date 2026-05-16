package com.qtm.tenants.appointment.repository;

import com.qtm.tenants.appointment.entity.AppointmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository JPA per gli appuntamenti con query specializzate.
 */
@Repository
public interface AppointmentRepository extends JpaRepository<AppointmentEntity, Long> {

    /**
     * Trova tutti gli appuntamenti per un piano terapeutico.
     *
     * @param therapeuticPlanId ID del piano terapeutico
     * @return lista di appuntamenti
     */
    List<AppointmentEntity> findByTherapeuticPlan_Id(Long therapeuticPlanId);

    /**
     * Trova gli appuntamenti per infermiere in una giornata specifica.
     * Restituisce appuntamenti che cadono nel giorno specificato.
     *
     * @param nurseId ID dell'infermiere
     * @param date data per cui cercare gli appuntamenti
     * @return lista di appuntamenti
     */
    @Query("SELECT a FROM AppointmentEntity a " +
           "WHERE a.nurse.id = :nurseId " +
           "AND CAST(a.startDateTime AS date) = :date " +
           "AND a.status != 'CANCELLED' " +
           "ORDER BY a.startDateTime ASC")
    List<AppointmentEntity> findByNurseAndDate(@Param("nurseId") Long nurseId, @Param("date") LocalDate date);

    /**
     * Trova gli appuntamenti per infermiere in un intervallo di date (per calendar).
     *
     * @param nurseId ID dell'infermiere
     * @param startDate data inizio intervallo
     * @param endDate data fine intervallo
     * @return lista di appuntamenti
     */
    @Query("SELECT a FROM AppointmentEntity a " +
           "WHERE a.nurse.id = :nurseId " +
           "AND CAST(a.startDateTime AS date) >= :startDate " +
           "AND CAST(a.startDateTime AS date) <= :endDate " +
           "AND a.status != 'CANCELLED' " +
           "ORDER BY a.startDateTime ASC")
    List<AppointmentEntity> findByNurseAndDateRange(
            @Param("nurseId") Long nurseId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Trova gli appuntamenti per piano terapeutico in un intervallo di date.
     *
     * @param therapeuticPlanId ID del piano terapeutico
     * @param startDate data inizio intervallo
     * @param endDate data fine intervallo
     * @return lista di appuntamenti
     */
    @Query("SELECT a FROM AppointmentEntity a " +
           "WHERE a.therapeuticPlan.id = :therapeuticPlanId " +
           "AND CAST(a.startDateTime AS date) >= :startDate " +
           "AND CAST(a.startDateTime AS date) <= :endDate " +
           "AND a.status != 'CANCELLED' " +
           "ORDER BY a.startDateTime ASC")
    List<AppointmentEntity> findByTherapeuticPlanAndDateRange(
            @Param("therapeuticPlanId") Long therapeuticPlanId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
