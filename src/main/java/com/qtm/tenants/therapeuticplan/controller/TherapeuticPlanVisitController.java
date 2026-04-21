package com.qtm.tenants.therapeuticplan.controller;

import com.qtm.tenants.therapeuticplan.dto.TherapeuticPlanVisitDto;
import com.qtm.tenants.therapeuticplan.service.TherapeuticPlanVisitService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/tenants/therapeutic-plans")
public class TherapeuticPlanVisitController {

    private final TherapeuticPlanVisitService visitService;

    public TherapeuticPlanVisitController(TherapeuticPlanVisitService visitService) {
        this.visitService = visitService;
    }

    @PostMapping("/{planId}/visits")
    public ResponseEntity<TherapeuticPlanVisitDto> createVisit(
            @PathVariable("planId") Long planId,
            @RequestBody TherapeuticPlanVisitDto dto
    ) {
        dto.setTherapeuticPlanId(planId);
        TherapeuticPlanVisitDto saved = visitService.save(dto);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{planId}/visits")
    public ResponseEntity<List<TherapeuticPlanVisitDto>> listByPlan(@PathVariable("planId") Long planId) {
        List<TherapeuticPlanVisitDto> list = visitService.findByTherapeuticPlanId(planId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{planId}/visits/{date}")
    public ResponseEntity<TherapeuticPlanVisitDto> getById(@PathVariable("planId") Long planId, @PathVariable("date") String date) {
        LocalDateTime d = LocalDateTime.parse(date);
        return visitService.findById(planId, d)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
