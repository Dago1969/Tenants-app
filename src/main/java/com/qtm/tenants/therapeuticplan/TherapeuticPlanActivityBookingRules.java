package com.qtm.tenants.therapeuticplan;

import java.util.Set;

/**
 * Regole pure per normalizzare e validare i codici tipo visita delle prenotazioni attivita.
 */
public final class TherapeuticPlanActivityBookingRules {

    private static final Set<String> ALLOWED_VISIT_TYPES = Set.of(
            "outpatient",
            "remote",
            "home",
            "followUpCenter",
            "trainingCenter"
    );

    private TherapeuticPlanActivityBookingRules() {
    }

    public static String normalizeVisitType(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Tipo visita obbligatorio");
        }

        String normalizedValue = value.trim();
        if (!ALLOWED_VISIT_TYPES.contains(normalizedValue)) {
            throw new IllegalArgumentException("Tipo visita non supportato");
        }

        return normalizedValue;
    }
}