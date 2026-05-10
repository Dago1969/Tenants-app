package com.qtm.tenants.therapeuticplan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO che rappresenta un attributo autorizzabile del piano terapeutico per la gestione granulari delle autorizzazioni.
 * Ogni attributo rappresenta un campo del piano terapeutico che può essere soggetto a regole di accesso/modifica.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TherapeuticPlanAttributeDto {
    /** Nome tecnico dell'attributo (es: patientId, projectCode, equipmentIds, ...). */
    private String name;
    /** Etichetta leggibile per l'utente (es: "Paziente", "Codice progetto", ...). */
    private String label;
    /** Descrizione o hint aggiuntivo per l'attributo. */
    private String description;
    /** Tipo di dato (es: string, number, date, list, ...). */
    private String type;
}
