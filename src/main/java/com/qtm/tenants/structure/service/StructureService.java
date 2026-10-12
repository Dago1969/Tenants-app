package com.qtm.tenants.structure.service;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.qtm.commonlib.dto.ASLDto;
import com.qtm.commonlib.dto.HospitalDto;
import com.qtm.commonlib.dto.HospitalOverviewDto;
import com.qtm.commonlib.dto.StructureDepartmentSourceDto;
import com.qtm.external.client.HealthStructureClient;
import com.qtm.external.client.StructureClient;
import com.qtm.tenants.structure.dto.StructureDepartmentOptionDto;
import com.qtm.tenants.structure.dto.StructureDto;
import com.qtm.tenants.structure.dto.StructureOverviewDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service orchestratore per il catalogo strutture fornito da Health Structure.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StructureService {

    private final HealthStructureClient healthStructureClient;
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
        List<StructureDto> allStructures = new java.util.ArrayList<>();

        // 1. Carica le ASL da QTMDB
        boolean includeAsl = structureTypeCode == null && structureTypes == null 
                || "ASL".equalsIgnoreCase(structureTypeCode) 
                || (structureTypes != null && structureTypes.toUpperCase().contains("ASL"));
                
        if (includeAsl) {
            try {
                List<StructureDto> remoteAsls = healthStructureClient.findAsl().stream()
                        .map(this::toStructureDto)
                        .toList();
                if (remoteAsls != null) {
                    allStructures.addAll(remoteAsls);
                }
            } catch (Exception e) {
                log.error("[StructureService] Errore nel recupero ASL da Health Structure: {}", e.getMessage(), e);
            }
        }

        // 2. Carica gli Ospedali da QTMDB
        boolean includeHospital = structureTypeCode == null && structureTypes == null 
                || "HOSPITAL".equalsIgnoreCase(structureTypeCode) 
                || (structureTypes != null && structureTypes.toUpperCase().contains("HOSPITAL"));

        if (includeHospital) {
            try {
                List<StructureDto> remoteHospitals = healthStructureClient.findHospitals().stream()
                        .map(this::toStructureDto)
                        .toList();
                if (remoteHospitals != null) {
                    allStructures.addAll(remoteHospitals);
                }
            } catch (Exception e) {
                log.error("[StructureService] Errore nel recupero ospedali da Health Structure: {}", e.getMessage(), e);
            }
        }

        // Applica i filtri ai dati ricevuti dal catalogo remoto.
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
        return structureClient.findHospitalOverview(regionCode, aslCode).stream()
            .map(this::toOverviewDto)
            .toList();
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
        HospitalOverviewDto hospital = structureClient.findHospitalOverview(null, null).stream()
            .filter(candidate -> Objects.equals(candidate.getStrutturaId(), structureId))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(
                NOT_FOUND, "Ospedale non trovato su QTMDB per ID: " + structureId));

        String structureCode = hospital.getCodiceStruttura();
        if (structureCode == null || structureCode.isBlank()) {
            throw new ResponseStatusException(NOT_FOUND,
                "Codice struttura mancante per l'ospedale ID: " + structureId);
        }

        List<StructureDepartmentSourceDto> departments = structureClient.findDepartmentsByStructureCode(structureCode);
        return departments.stream()
            .map(department -> new StructureDepartmentOptionDto(department.getId(), department.getDescrizioneDisciplina()))
            .toList();
    }

    private StructureDto toStructureDto(ASLDto asl) {
        StructureDto dto = new StructureDto();
        dto.setId(asl.getId());
        dto.setExternalId(asl.getId());
        dto.setExternalSource("HEALTH_STRUCTURE");
        dto.setCode(asl.getCodiceAzienda());
        dto.setName(asl.getDenominazioneAzienda());
        dto.setAddress(asl.getIndirizzo());
        dto.setProvinceId(asl.getProvinceId());
        dto.setCityId(asl.getCityId());
        dto.setRegion(asl.getCodiceRegione());
        dto.setYear(asl.getAnno());
        dto.setEmail(asl.getEmail());
        dto.setPhone(asl.getTelefono());
        dto.setStructureType("ASL");
        dto.setActive(true);
        return dto;
    }

    private StructureDto toStructureDto(HospitalDto hospital) {
        StructureDto dto = new StructureDto();
        dto.setId(hospital.getId());
        dto.setExternalId(hospital.getId());
        dto.setExternalSource("HEALTH_STRUCTURE");
        dto.setCode(hospital.getCodiceStruttura());
        dto.setName(hospital.getStruttura());
        dto.setAddress(hospital.getIndirizzo());
        dto.setCityId(hospital.getCityId());
        dto.setCity(hospital.getComune());
        dto.setProvince(hospital.getSiglaProvincia());
        dto.setRegion(hospital.getRegione());
        dto.setYear(hospital.getAnno());
        dto.setParentStructureId(hospital.getAslId());
        dto.setParentStructureName(hospital.getAsl());
        dto.setStructureType("HOSPITAL");
        dto.setStructureTypeDescription(hospital.getTipoStruttura());
        dto.setActive(true);
        return dto;
    }

    private StructureOverviewDto toOverviewDto(HospitalOverviewDto hospital) {
        return StructureOverviewDto.builder()
                .aslId(hospital.getAslId())
                .strutturaId(hospital.getStrutturaId())
                .codiceRegione(hospital.getCodiceRegione())
                .regione(hospital.getRegione())
                .codiceAsl(hospital.getCodiceAsl())
                .asl(hospital.getAsl())
                .codiceStruttura(hospital.getCodiceStruttura())
                .struttura(hospital.getStruttura())
                .build();
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