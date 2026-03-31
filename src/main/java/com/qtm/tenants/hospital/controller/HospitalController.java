package com.qtm.tenants.hospital.controller;

import com.qtm.tenants.hospital.dto.HospitalDto;
import com.qtm.tenants.hospital.service.HospitalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Controller REST CRUD ospedali dedicato.
 */
@RestController
@RequestMapping("/api/tenants/hospitals")
@RequiredArgsConstructor
public class HospitalController {
    private final HospitalService hospitalService;

    @PostMapping
    public ResponseEntity<HospitalDto> create(@RequestBody HospitalDto hospitalDto) {
        return ResponseEntity.ok(hospitalService.create(hospitalDto));
    }

    @GetMapping
    public ResponseEntity<List<HospitalDto>> findAll() {
        return ResponseEntity.ok(hospitalService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HospitalDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(hospitalService.findById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        hospitalService.delete(id);
        return ResponseEntity.noContent().build();
    }
}