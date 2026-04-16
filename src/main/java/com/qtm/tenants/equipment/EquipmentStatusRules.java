package com.qtm.tenants.equipment;

import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Regole pure Java per normalizzare e validare gli stati disponibili delle attrezzature.
 */
public final class EquipmentStatusRules {

    public static final String IN_STOCK = "in_magazzino";
    public static final String ASSIGNED = "assegnato";
    public static final String IN_REVIEW = "in_revisione";
    public static final String BROKEN = "rotto";

    private static final Set<String> ALLOWED_STATUSES = Set.of(
            IN_STOCK,
            ASSIGNED,
            IN_REVIEW,
            BROKEN
    );

    private EquipmentStatusRules() {
    }

    public static String normalizeStatus(String value) {
        String normalizedValue = value == null
                ? ""
                : value.trim().toLowerCase(Locale.ROOT).replace(' ', '_');

        if (normalizedValue.isEmpty()) {
            return IN_STOCK;
        }

        if (!ALLOWED_STATUSES.contains(normalizedValue)) {
            throw new IllegalArgumentException("Stato attrezzatura non valido: " + value);
        }

        return normalizedValue;
    }

    public static List<String> supportedStatuses() {
        return List.of(IN_STOCK, ASSIGNED, IN_REVIEW, BROKEN);
    }
}