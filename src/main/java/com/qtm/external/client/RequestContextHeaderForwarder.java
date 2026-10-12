package com.qtm.external.client;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/** Inoltra ai servizi remoti il contesto di autorizzazione della richiesta corrente. */
public final class RequestContextHeaderForwarder {

    private static final String[] FORWARDED_HEADERS = {
            HttpHeaders.AUTHORIZATION,
            "X-Selected-Role",
            "X-Selected-Client",
            "X-Selected-Project"
    };

    private RequestContextHeaderForwarder() {
    }

    public static void forward(HttpHeaders headers) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return;
        }

        HttpServletRequest request = attributes.getRequest();
        for (String headerName : FORWARDED_HEADERS) {
            String value = request.getHeader(headerName);
            if (value != null && !value.isBlank()) {
                headers.set(headerName, value.trim());
            }
        }
    }

    public static void forward(HttpHeaders headers, String selectedRole) {
        forward(headers);
        if (selectedRole != null && !selectedRole.isBlank()) {
            headers.set("X-Selected-Role", selectedRole.trim());
        }
    }
}