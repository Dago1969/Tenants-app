package com.qtm.tenants.structure.controller;

import com.qtm.tenants.authorization.service.ControllerFunctionAuthorizationService;
import com.qtm.tenants.structure.StructureModuleCodes;
import com.qtm.tenants.structure.dto.StructureBulkImportResultDto;
import com.qtm.tenants.structure.service.StructureBulkImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller REST dedicato all'import massivo di strutture da file CSV/XLS/XLSX.
 */
@RestController
@RequestMapping("/api/tenants/structures/import")
@RequiredArgsConstructor
public class StructureBulkImportController {

    private final StructureBulkImportService structureBulkImportService;
    private final ControllerFunctionAuthorizationService controllerFunctionAuthorizationService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StructureBulkImportResultDto> create(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    ) {
        controllerFunctionAuthorizationService.requireFullEditPermission(
                selectedRole,
                StructureModuleCodes.BULK_IMPORT,
                ControllerFunctionAuthorizationService.CREATE_FUNCTION_CODE
        );
        return ResponseEntity.ok(structureBulkImportService.importStructures(file));
    }
}