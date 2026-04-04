package com.qtm.tenants.structure;

import java.util.List;
import java.util.Map;

/**
 * Registro centralizzato dei moduli autorizzativi legati alle strutture.
 */
public final class StructureModuleCodes {

    public static final String GENERIC = "STRUCTURE";
    public static final String ASL = "STRUCTURE-ASL";
    public static final String HOSPITAL = "HOSPITAL";
    public static final String HOSPITAL_PHARMACY = "STRUCTURE-FARMACY-O";
    public static final String RETAIL_PHARMACY = "STRUCTURE-FARMACY-R";
    public static final String LOGISTICS_WAREHOUSE = "STRUCTURE_LOGISTICS_WAREHOUSE";
    public static final String MATERIAL_WAREHOUSE = "STRUCTURE_MATERIAL_WAREHOUSE";
    public static final String PHARMA_COMPANY = "STRUCTURE_PHARMA_COMPANY";
    public static final String SPECIALIST_CLINIC = "STRUCTURE_SPECIALIST_CLINIC";

    public static final List<String> AUTHORIZATION_MODULE_CODES = List.of(
            GENERIC,
            ASL,
            HOSPITAL,
            HOSPITAL_PHARMACY,
            RETAIL_PHARMACY,
            LOGISTICS_WAREHOUSE,
            MATERIAL_WAREHOUSE,
            PHARMA_COMPANY,
            SPECIALIST_CLINIC
    );

    private static final Map<String, String> MODULE_NAMES = Map.ofEntries(
            Map.entry(GENERIC, "Strutture"),
            Map.entry(ASL, "ASL"),
            Map.entry(HOSPITAL, "Ospedali"),
            Map.entry(HOSPITAL_PHARMACY, "Farmacie Ospedaliere"),
            Map.entry(RETAIL_PHARMACY, "Farmacie Retail"),
            Map.entry(LOGISTICS_WAREHOUSE, "Magazzini Logistica"),
            Map.entry(MATERIAL_WAREHOUSE, "Magazzini Materiale"),
            Map.entry(PHARMA_COMPANY, "Aziende Farmaceutiche"),
            Map.entry(SPECIALIST_CLINIC, "Cliniche e Ambulatori Specialistici")
    );

    private static final Map<String, String> STRUCTURE_TYPE_TO_MODULE_CODE = Map.ofEntries(
            Map.entry("ASL", ASL),
            Map.entry("HOSPITAL", HOSPITAL),
            Map.entry("HOSPITAL_PHARMACY", HOSPITAL_PHARMACY),
            Map.entry("RETAIL_PHARMACY", RETAIL_PHARMACY),
            Map.entry("LOGISTICS_WAREHOUSE", LOGISTICS_WAREHOUSE),
            Map.entry("MATERIAL_WAREHOUSE", MATERIAL_WAREHOUSE),
            Map.entry("PHARMA_COMPANY", PHARMA_COMPANY),
            Map.entry("SPECIALIST_CLINIC", SPECIALIST_CLINIC)
    );

    private StructureModuleCodes() {
    }

    public static String resolveModuleCode(String structureType) {
        if (structureType == null || structureType.isBlank()) {
            return GENERIC;
        }

        return STRUCTURE_TYPE_TO_MODULE_CODE.getOrDefault(structureType, GENERIC);
    }

    public static String resolveModuleName(String moduleCode) {
        return MODULE_NAMES.getOrDefault(moduleCode, moduleCode);
    }
}