package com.qtm.tenants.appointment.entity;

/**
 * Tipo di ricorrenza per gli appuntamenti.
 * SINGLE: evento singolo senza ricorrenza
 * DAILY: ricorre ogni giorno fino a recurrenceEndDate
 * WEEKLY: ricorre ogni settimana fino a recurrenceEndDate
 * MONTHLY: ricorre ogni mese fino a recurrenceEndDate
 */
public enum RecurrenceType {
    SINGLE,
    DAILY,
    WEEKLY,
    MONTHLY
}
