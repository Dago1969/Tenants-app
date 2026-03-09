package com.qtm.tenants.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface OperationLogRepository extends JpaRepository<OperationLogEntity, Long>, JpaSpecificationExecutor<OperationLogEntity> {
}
