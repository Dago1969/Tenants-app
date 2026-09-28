package com.qtm.tenants.structure.service;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.qtm.external.client.StructureClient;
import com.qtm.tenants.structure.dto.StructureDepartmentOptionDto;
import com.qtm.commonlib.dto.StructureDepartmentSourceDto;
import com.qtm.tenants.structure.dto.StructureDto;
import com.qtm.tenants.structure.dto.StructureOverviewDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service orchestratore per le strutture delegato interamente al client remoto QTMDB.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StructureService {

    private final StructureClient structureClient;

    @Transactional
    public StructureDto create(StructureDto structureDto) {
        throw new ResponseStatusException(BAD_REQUEST, "La creazione locale delle strutture è disabilitata. Gestire le strutture su QTMDB.");
    }

    @Transactional(readOnly = true)
    public List<StructureDto> findAll(String structureTypeCode, Long parentStructureId) {
        return findAll(structureTypeCode, null, parentStructureId, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<StructureDto> findAll(
            String structureTypeCode,
            String structureTypes,
            Long parentStructureId,
            String code,
            String name,
            String region,
            String parentStructureName,
            String city,
            Boolean active
    ) {
        List<StructureDto> allStructures = new ArrayList<>();

        // 1. Carica le ASL da QTMDB
        boolean includeAsl = structureTypeCode == null && structureTypes == null 
                || "ASL".equalsIgnoreCase(structureTypeCode) 
                || (structureTypes != null && structureTypes.toUpperCase().contains("ASL"));
                
        if (includeAsl) {
            try {
                List<StructureDto> remoteAsls = structureClient.findAll("ASL", null, null, null, null, null, null, null, null, null);
                if (remoteAsls != null) {
                    allStructures.addAll(remoteAsls);
                }
            } catch (Exception e) {
                log.error("[StructureService] Errore nel recupero ASL da QTMDB: {}", e.getMessage(), e);
            }
        }

        // 2. Carica gli Ospedali da QTMDB
        boolean includeHospital = structureTypeCode == null && structureTypes == null 
                || "HOSPITAL".equalsIgnoreCase(structureTypeCode) 
                || (structureTypes != null && structureTypes.toUpperCase().contains("HOSPITAL"));

        if (includeHospital) {
            try {
                List<StructureDto> remoteHospitals = structureClient.findAll("HOSPITAL", null, null, null, null, null, null, null, null, null);
                if (remoteHospitals != null) {
                    allStructures.addAll(remoteHospitals);
                }
            } catch (Exception e) {
                log.error("[StructureService] Errore nel recupero Ospedali da QTMDB: {}", e.getMessage(), e);
            }
        }

        // 3. Applica i filtri sui dati ricevuti da QTMDB
        return allStructures.stream()
                .filter(dto -> matchesFilter(dto.getStructureType(), structureTypeCode))
                .filter(dto -> matchesFilter(dto.getCode(), code))
                .filter(dto -> matchesFilter(dto.getName(), name))
                .filter(dto -> matchesFilter(dto.getRegion(), region))
                .filter(dto -> parentStructureId == null || Objects.equals(dto.getParentStructureId(), parentStructureId))
                .filter(dto -> matchesFilter(dto.getParentStructureName(), parentStructureName))
                .filter(dto -> matchesFilter(dto.getCity(), city))
                .filter(dto -> active == null || Boolean.TRUE.equals(dto.isActive()) == active)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StructureOverviewDto> findOverview(String regionCode, String aslCode) {
        return structureClient.findOverview(regionCode, aslCode, null);
    }

    @Transactional(readOnly = true)
    public StructureDto findById(Long id) {
        return findAll(null, null).stream()
                .filter(item -> item.getId() != null && item.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Struttura non trovata su QTMDB per ID: " + id));
    }

    @Transactional(readOnly = true)
    public String findStructureTypeCode(Long id) {
        return findById(id).getStructureType();
    }

    @Transactional(readOnly = true)
    public List<StructureDepartmentOptionDto> findDepartmentOptions(Long structureId) {
        return structureClient.findDepartmentsByStructureId(structureId, null).stream()
            .map(department -> new StructureDepartmentOptionDto(
                department.getId(),
                department.getDescrizioneDisciplina()))
            .toList();
    }

    @Transactional
    public StructureDto update(Long id, StructureDto structureDto) {
        throw new ResponseStatusException(BAD_REQUEST, "La modifica delle strutture da TENAPP è disabilitata. Utilizzare i servizi QTMDB.");
    }

    @Transactional
    public StructureDto associateExternal(String externalSource, Long externalId, String structureTypeCode, String name, Long parentExternalId, String referentsJson) {
        return findById(externalId);
    }

    @Transactional
    public void deactivate(Long id) {
        throw new ResponseStatusException(BAD_REQUEST, "La disattivazione delle strutture locali è disabilitata.");
    }

    @Transactional
    public void delete(Long id) {
        throw new ResponseStatusException(BAD_REQUEST, "L'eliminazione delle strutture da TENAPP è disabilitata.");
    }

//    @Transactional(readOnly = true)
//    public List<StructureParentOptionDto> findParentOptions(String structureTypeCode) {
//        String parentTypeCode = resolveStructureTypeParentCode(structureTypeCode);
//        if (parentTypeCode == null) {
//            return List.of();
//        }
//
//        return findAll(parentTypeCode, null).stream()
//                .map(dto -> new StructureParentOptionDto(dto.getId(), dto.getName(), dto.getCode()))
//                .toList();
//    }

//    @Transactional(readOnly = true)
//    public List<StructureTypeDto> findSupportedTypes() {
//        return structureTypeRegistry.findAll().stream()
//                .map(type -> new StructureTypeDto(type.getCode(), type.getDescription()))
//                .toList();
//    }
//
//    private String resolveStructureTypeParentCode(String structureTypeCode) {
//        try {
//            return structureTypeRegistry.getRequiredByCode(structureTypeCode).getParentTypeCode();
//        } catch (Exception e) {
//            return null;
//        }
//    }

    private boolean matchesFilter(String value, String filter) {
        if (filter == null || filter.isBlank()) {
            return true;
        }
        return value != null && value.toLowerCase().contains(filter.trim().toLowerCase());
    }
}