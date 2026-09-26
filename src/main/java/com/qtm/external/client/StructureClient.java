package com.qtm.external.client;

import java.util.List;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import com.qtm.tenants.structure.dto.StructureDepartmentOptionDto;
import com.qtm.tenants.structure.dto.StructureDto;
import com.qtm.tenants.structure.dto.StructureOverviewDto;

// Sostituisci 'name' e 'url' con il nome del servizio su Eureka o la proprietà application.yml
@FeignClient(name = "qtmdb-structure-client", url = "${NG_APP_API_BASE_URL:http://localhost:8086/api}")
public interface StructureClient {

    @PostMapping("/hospital")
    StructureDto create(
            @RequestBody StructureDto structureDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    );

    @GetMapping("/hospital")
    List<StructureDto> findAll(
            @RequestParam(name = "structureType", required = false) String structureType,
            @RequestParam(name = "structureTypes", required = false) String structureTypes,
            @RequestParam(name = "parentStructureId", required = false) Long parentStructureId,
            @RequestParam(name = "code", required = false) String code,
            @RequestParam(name = "name", required = false) String name,
            @RequestParam(name = "region", required = false) String region,
            @RequestParam(name = "parentStructureName", required = false) String parentStructureName,
            @RequestParam(name = "city", required = false) String city,
            @RequestParam(name = "active", required = false) Boolean active,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    );

    @GetMapping("/hospital/overview")
    List<StructureOverviewDto> findOverview(
            @RequestParam(name = "regionCode", required = false) String regionCode,
            @RequestParam(name = "aslCode", required = false) String aslCode,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    );

    @GetMapping("/hospital/{id}")
    StructureDto findById(
            @PathVariable("id") Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    );

//    @GetMapping("/hospital/{id}/departments")
//    List<StructureDepartmentOptionDto> findDepartmentsByStructureId(
//            @PathVariable("id") Long id,
//            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
//    );

    @GetMapping("/structure-departments/by-structure/{id}")
    List<StructureDepartmentOptionDto> findDepartmentsByStructureId(
            @PathVariable("id") Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    );
    
    @PutMapping("/hospital/{id}")
    StructureDto update(
            @PathVariable("id") Long id,
            @RequestBody StructureDto structureDto,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    );

    
    @DeleteMapping("/hospital/{id}")
    void delete(
            @PathVariable("id") Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    );

    @PostMapping("/hospital/associate")
    StructureDto associate(
            @RequestBody java.util.Map<String, Object> body,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    );

    @PostMapping("/hospital/{id}/deactivate")
    void deactivate(
            @PathVariable("id") Long id,
            @RequestHeader(name = "X-Selected-Role", required = false) String selectedRole
    );
}