package com.qtm.tenants.structure;

import lombok.Getter;

import java.util.Arrays;

/**
 * Tipologie di strutture gestite nel dominio tenant con descrizione e relazione gerarchica opzionale.
 */
@Getter
public enum StructureType {

    ASL(
            "Azienda Sanitaria Locale",
            "Nodo capofila territoriale: raggruppa ospedali, farmacie e altre strutture, assicurando coerenza dei flussi e visibilita dati multi-tenant.",
            null
    ),
    HOSPITAL(
            "Struttura Ospedaliera",
            "Centro clinico dove si prescrivono e si monitorano i Piani Terapeutici; fa capo a una o piu farmacie ospedaliere.",
            ASL
    ),
    HOSPITAL_PHARMACY(
            "Farmacia Ospedaliera",
            "Hub logistico interno all'ospedale per preparazione e tracciabilita ordini.",
            HOSPITAL
    ),
    RETAIL_PHARMACY(
            "Farmacia Retail",
            "Punto di ritiro di prossimita o ultimo-miglio delivery nei progetti territoriali.",
            ASL
    ),
    LOGISTICS_WAREHOUSE(
            "Magazzino Logistica",
            "Deposito centrale esterno o interno che alimenta FO o FR; collegabile via API o WMS per stock real-time.",
            ASL
    ),
    MATERIAL_WAREHOUSE(
            "Magazzino Materiale",
            "Distribuzione interna di gadget, volantini e materiale monouso o promozionale.",
            ASL
    ),
    PHARMA_COMPANY(
            "Azienda Farmaceutica",
            "Ente promotore di progetti PSP, aderenza o delivery con interesse a KPI clinici, logistici e farmacovigilanza.",
            null
    ),
    SPECIALIST_CLINIC(
            "Clinica Ambulatorio Specialistica",
            "Struttura extra-ospedaliera che utilizza gli stessi flussi PT dell'ospedale per progetti cronici o PSP.",
            ASL
    ),
    VENDOR(
            "Fornitore",
            "Nodo organizzativo per aziende terze che forniscono beni o servizi essenziali alla delivery di un PSP, inclusi dispositivi, logistica, laboratori e personale infermieristico.",
            null
    );

    private final String description;
    private final String functionDescription;
    private final StructureType parentType;

    StructureType(String description, String functionDescription, StructureType parentType) {
        this.description = description;
        this.functionDescription = functionDescription;
        this.parentType = parentType;
    }

    public static StructureType fromCode(String code) {
        return Arrays.stream(values())
                .filter(type -> type.name().equalsIgnoreCase(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Tipo struttura non supportato: " + code));
    }
}
