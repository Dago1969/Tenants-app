package com.qtm.tenants.therapeuticplan;

import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Regole pure Java per normalizzare e validare gli stati disponibili dei piani terapeutici.
 */
public final class TherapeuticPlanStatusRules {

    public static final String DRAFT = "draft";
    public static final String ACTIVE = "active";
    public static final String COMPLETED = "completed";
    public static final String SUSPENDED = "suspended";
    public static final String CANCELLED = "cancelled";

    private static final Set<String> ALLOWED_STATUSES = Set.of(
            DRAFT,
            ACTIVE,
            COMPLETED,
            SUSPENDED,
            CANCELLED
    );

    private TherapeuticPlanStatusRules() {
    }

    public static String normalizeStatus(String value) {
        String normalizedValue = value == null
                ? ""
                : value.trim().toLowerCase(Locale.ROOT).replace(' ', '_');

        if (normalizedValue.isEmpty()) {
            return DRAFT;
        }

        if (!ALLOWED_STATUSES.contains(normalizedValue)) {
            throw new IllegalArgumentException("Stato piano terapeutico non valido: " + value);
        }

        return normalizedValue;
    }

    public static List<String> supportedStatuses() {
        return List.of(DRAFT, ACTIVE, COMPLETED, SUSPENDED, CANCELLED);
    }
}