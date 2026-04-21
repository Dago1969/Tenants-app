package com.qtm.tenants.therapeuticplan;

import java.util.Set;

/**
 * Regole pure per normalizzare e validare tipo e stato delle richieste contatto del piano terapeutico.
 */
public final class TherapeuticPlanContactRequestRules {

    private static final Set<String> ALLOWED_REQUEST_TYPES = Set.of(
            "patientViaContactCenter",
            "scheduled"
    );

    private static final Set<String> ALLOWED_STATUSES = Set.of(
            "received",
            "toBeBooked",
            "booked",
            "closed"
    );

    private TherapeuticPlanContactRequestRules() {
    }

    public static String normalizeRequestType(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Tipo richiesta obbligatorio");
        }

        String normalizedValue = value.trim();
        if (!ALLOWED_REQUEST_TYPES.contains(normalizedValue)) {
            throw new IllegalArgumentException("Tipo richiesta non supportato");
        }

        return normalizedValue;
    }

    public static String normalizeStatus(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Stato richiesta obbligatorio");
        }

        String normalizedValue = value.trim();
        if (!ALLOWED_STATUSES.contains(normalizedValue)) {
            throw new IllegalArgumentException("Stato richiesta non supportato");
        }

        return normalizedValue;
    }
}