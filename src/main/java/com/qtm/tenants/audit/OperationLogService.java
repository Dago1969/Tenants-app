package com.qtm.tenants.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OperationLogService {

    private final OperationLogRepository repository;
    private final HttpServletRequest request;
    private final ObjectMapper objectMapper;

    @Transactional
    public void log(OperationLogContext context) {
        repository.save(OperationLogEntity.builder()
                .occurredAt(Instant.now())
                .moduleCode(context.getModuleCode())
                .functionCode(context.getFunctionCode())
                .operation(context.getOperation())
                .description(context.getDescription())
                .targetId(context.getTargetId())
                .roleId(context.getRoleId())
                .username(resolveUsername(context.getUsername()))
                .clientIp(extractClientIp())
                .userAgent(request.getHeader("User-Agent"))
                .metadata(serializeMetadata(context.getMetadata()))
                .build());
    }

    private String resolveUsername(String candidate) {
        if (candidate != null && !candidate.isBlank()) {
            return candidate;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return "anonymous";
        }

        return authentication.getName();
    }

    private String extractClientIp() {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String serializeMetadata(Map<String, String> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException ex) {
            return metadata.toString();
        }
    }
}
