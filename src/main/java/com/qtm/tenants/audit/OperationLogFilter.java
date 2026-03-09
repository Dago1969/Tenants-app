package com.qtm.tenants.audit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

@Component
@RequiredArgsConstructor
public class OperationLogFilter extends OncePerRequestFilter {

    private static final String TENANTS_API_PREFIX = "/api/tenants/";
    private static final Map<String, String> LOGGABLE_OPERATION_BY_METHOD = Map.of(
        "POST", "INSERT",
            "PUT", "UPDATE",
            "DELETE", "DELETE"
    );

    private final OperationLogService operationLogService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        try {
            filterChain.doFilter(wrappedRequest, response);
        } finally {
            logRequest(wrappedRequest);
        }
    }

    private void logRequest(ContentCachingRequestWrapper request) {
        String path = request.getRequestURI();
        if (!path.startsWith(TENANTS_API_PREFIX) || shouldSkip(path)) {
            return;
        }

        String httpMethod = request.getMethod();
        if (!isLoggableMethod(httpMethod)) {
            return;
        }

        String moduleCode = resolveModuleCode(path);
        if (moduleCode == null) {
            return;
        }

        String functionCode = resolveFunctionCode(httpMethod, path);
        String operation = resolveOperation(functionCode, httpMethod);
        String description = String.format("%s %s", operation, path);
        String targetId = resolveTargetId(path);

        Map<String, String> metadata = buildMetadata(request);

        operationLogService.log(OperationLogContext.builder()
                .moduleCode(moduleCode)
                .functionCode(functionCode)
                .operation(operation)
                .description(description)
                .targetId(targetId)
                .roleId(request.getHeader("X-Selected-Role"))
                .metadata(metadata)
                .build());
    }

    private boolean shouldSkip(String path) {
        return path.startsWith("/actuator")
                || path.startsWith("/error")
                || path.startsWith("/api/tenants/operation-logs")
                || path.contains("swagger")
                || path.contains("webjars");
    }

    private String resolveModuleCode(String path) {
        String trimmed = path.substring(TENANTS_API_PREFIX.length());
        if (trimmed.isBlank()) {
            return null;
        }
        String[] segments = trimmed.split("/");
        if (segments.length == 0) {
            return null;
        }
        return segments[0].toUpperCase(Locale.ROOT);
    }

    private String resolveFunctionCode(String method, String path) {
        return LOGGABLE_OPERATION_BY_METHOD.get(method);
    }

    private boolean isLoggableMethod(String method) {
        return LOGGABLE_OPERATION_BY_METHOD.containsKey(method);
    }

    private String resolveOperation(String functionCode, String method) {
        if (functionCode == null) {
            return method;
        }
        return functionCode;
    }

    private String resolveTargetId(String path) {
        String[] segments = path.split("/");
        if (segments.length == 0) {
            return null;
        }
        String last = segments[segments.length - 1];
        if (last.isBlank() || last.equals("search")) {
            return null;
        }
        if (last.matches("\\d+")) {
            return last;
        }
        return null;
    }

    private Map<String, String> buildMetadata(ContentCachingRequestWrapper request) {
        Map<String, String> metadata = new LinkedHashMap<>();
        String query = request.getQueryString();
        if (query != null && !query.isBlank()) {
            metadata.put("query", query);
        }
        byte[] content = request.getContentAsByteArray();
        if (content.length > 0) {
            String body = new String(content, StandardCharsets.UTF_8).trim();
            if (!body.isBlank()) {
                metadata.put("body", body);
            }
        }
        return metadata;
    }
}
