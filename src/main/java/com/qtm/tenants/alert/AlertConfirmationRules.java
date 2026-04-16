package com.qtm.tenants.alert;

import java.util.Locale;

/**
 * Regole di dominio pure per normalizzare e validare lo stato di conferma degli alert clinici.
 */
public final class AlertConfirmationRules {

    public static final String YES = "yes";
    public static final String NO = "no";
    public static final String NA = "na";

    private AlertConfirmationRules() {
    }

    public static String normalizeConfirmationSent(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Conferma inviata obbligatoria");
        }

        return switch (value.trim().toLowerCase(Locale.ROOT)) {
            case YES, "si", "sì" -> YES;
            case NO -> NO;
            case NA, "n/a", "n.a." -> NA;
            default -> throw new IllegalArgumentException("Valore conferma inviata non valido");
        };
    }

    public static void validateCombination(Boolean confirmationRequired, String confirmationSent) {
        if (confirmationRequired == null) {
            throw new IllegalArgumentException("Indicatore richiesta conferma obbligatorio");
        }
        if (confirmationRequired && NA.equals(confirmationSent)) {
            throw new IllegalArgumentException("La conferma inviata non puo essere N/A quando la richiesta conferma e attiva");
        }
        if (!confirmationRequired && !NA.equals(confirmationSent)) {
            throw new IllegalArgumentException("La conferma inviata deve essere N/A quando la richiesta conferma non e richiesta");
        }
    }
}