package com.qtm.tenants.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "operation_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "module_code", nullable = false)
    private String moduleCode;

    @Column(name = "function_code")
    private String functionCode;

    @Column(nullable = false)
    private String operation;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "target_id")
    private String targetId;

    @Column(name = "role_id")
    private String roleId;

    @Column(nullable = false)
    private String username;

    @Column(name = "client_ip")
    private String clientIp;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(columnDefinition = "TEXT")
    private String metadata;
}
