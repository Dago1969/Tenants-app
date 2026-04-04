package com.qtm.tenants.structure.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Esito dell'import massivo delle strutture.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StructureBulkImportResultDto {

    private int totalRows;
    private int importedCount;
    private List<String> importedCodes = new ArrayList<>();
    private String message;
}