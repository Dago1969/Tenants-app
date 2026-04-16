package com.qtm.tenants.notification;

import java.time.LocalDate;

/**
 * Regole di dominio pure per validare lo stato di conferma delle notifiche di riepilogo.
 */
public final class NotificationConfirmationRules {

    private NotificationConfirmationRules() {
    }

    public static void validateCombination(Boolean confirmed, LocalDate confirmationDate, String notes) {
        boolean hasNotes = notes != null && !notes.isBlank();

        if (confirmed == null) {
            if (confirmationDate != null) {
                throw new IllegalArgumentException("La data conferma non puo essere valorizzata senza esito conferma");
            }
            return;
        }

        if (confirmationDate == null) {
            throw new IllegalArgumentException("La data conferma e obbligatoria quando la notifica e stata valutata");
        }

        if (Boolean.FALSE.equals(confirmed) && !hasNotes) {
            throw new IllegalArgumentException("Le note sono obbligatorie quando la conferma e negativa");
        }
    }
}