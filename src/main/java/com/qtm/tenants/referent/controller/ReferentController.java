package com.qtm.tenants.referent.controller;

import com.qtm.tenants.referent.dto.ReferentDto;
import com.qtm.tenants.referent.service.ReferentService;
import com.qtm.tenants.referent.mapper.ReferentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller REST per i referenti struttura.
 */
@RestController
@RequestMapping("/api/tenants/referents")
@RequiredArgsConstructor
public class ReferentController {
    private final ReferentService referentService;
    private final ReferentMapper referentMapper;

    @GetMapping
    public ResponseEntity<List<ReferentDto>> findAll() {
        return ResponseEntity.ok(
            referentService.findAll().stream().map(referentMapper::toDto).collect(Collectors.toList())
        );
    }
}
