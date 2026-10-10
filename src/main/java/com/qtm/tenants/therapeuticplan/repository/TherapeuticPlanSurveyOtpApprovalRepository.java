package com.qtm.tenants.therapeuticplan.repository;

import com.qtm.tenants.therapeuticplan.entity.TherapeuticPlanSurveyOtpApprovalEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/** Repository per il consumo atomico dei ticket di approvazione OTP. */
@Repository
public interface TherapeuticPlanSurveyOtpApprovalRepository
        extends JpaRepository<TherapeuticPlanSurveyOtpApprovalEntity, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select ticket from TherapeuticPlanSurveyOtpApprovalEntity ticket where ticket.token = :token")
    Optional<TherapeuticPlanSurveyOtpApprovalEntity> findForUpdateByToken(@Param("token") String token);
}
