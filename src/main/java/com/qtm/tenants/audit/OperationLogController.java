package com.qtm.tenants.audit;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller REST per consultare i log delle operazioni tenant.
 */
@RestController
@RequestMapping("/api/tenants/operation-logs")
@RequiredArgsConstructor
public class OperationLogController {

    private final OperationLogSearchService operationLogSearchService;

    @GetMapping("/search")
    public ResponseEntity<List<OperationLogDto>> search(
            @RequestParam(required = false) String moduleCode,
            @RequestParam(required = false) String functionCode,
            @RequestParam(required = false) String operation,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String roleId,
            @RequestParam(required = false) String targetId,
            @RequestParam(required = false) String description
    ) {
        return ResponseEntity.ok(operationLogSearchService.search(
                moduleCode,
                functionCode,
                operation,
                username,
                roleId,
                targetId,
                description
        ));
    }
}