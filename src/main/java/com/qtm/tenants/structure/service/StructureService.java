package com.qtm.tenants.structure.service;

import com.qtm.commonlib.dto.ASLDto;
import com.qtm.tenants.referent.dto.ReferentDto;
import com.qtm.tenants.structure.StructureType;
import com.qtm.tenants.structure.dto.StructureDto;
import com.qtm.tenants.structure.dto.StructureParentOptionDto;
import com.qtm.tenants.structure.dto.StructureTypeDto;
import com.qtm.tenants.structure.entity.StructureEntity;
import com.qtm.tenants.structure.mapper.StructureMapper;
import com.qtm.tenants.structure.repository.StructureRepository;
import com.qtm.tenants.geography.service.DashboardGeographyService;
import com.qtm.tenants.geography.dto.DashboardCityDto;
import com.qtm.tenants.geography.dto.DashboardProvinceDto;
import com.qtm.tenants.geography.dto.DashboardRegionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.METHOD_NOT_ALLOWED;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service orchestratore CRUD strutture con decoding del tipo e gestione gerarchica parent-child.
 */
@Service
@RequiredArgsConstructor
public class StructureService {

    private static final String ASL_TYPE_CODE = "ASL";
    private static final String HOSPITAL_TYPE_CODE = "HOSPITAL";

    private final StructureRepository structureRepository;
    private final StructureMapper structureMapper;
    private final StructureTypeRegistry structureTypeRegistry;
    private final DashboardAslClient dashboardAslClient;
    private final TicketAslClient ticketAslClient;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private DashboardGeographyService dashboardGeographyService;

    @Transactional
    public StructureDto create(StructureDto structureDto) {
        if (isAslType(structureDto.getStructureType())) {
            throw new ResponseStatusException(METHOD_NOT_ALLOWED, "L'inserimento manuale delle ASL non è consentito");
        }
        StructureType structureType = resolveStructureType(structureDto.getStructureType());
        validateCodeUniqueness(structureDto.getCode(), null);
        StructureEntity entity = structureMapper.toEntity(structureDto);
        applyParentValidation(entity, structureType);
        StructureEntity saved = structureRepository.save(entity);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<StructureDto> findAll(String structureTypeCode, Long parentStructureId) {
        return findAll(structureTypeCode, parentStructureId, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<StructureDto> findAll(
            String structureTypeCode,
            Long parentStructureId,
            String code,
            String name,
            String city,
            Boolean active
    ) {
        if (isAslType(structureTypeCode)) {
            return findAllRemoteAsls(code, name, city, active);
        }
        List<StructureEntity> entities = resolveEntities(structureTypeCode, parentStructureId).stream()
            .filter(entity -> matchesFilter(entity.getCode(), code))
            .filter(entity -> matchesFilter(entity.getName(), name))
            .filter(entity -> matchesFilter(entity.getCity(), city))
            .filter(entity -> active == null || Boolean.TRUE.equals(entity.getActive()) == active)
            .toList();
        return toDtos(entities);
        }

    @Transactional(readOnly = true)
    public StructureDto findById(Long id) {
        if (belongsToRemoteAsl(id)) {
            return findRemoteAslById(id);
        }
        return toDto(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public String findStructureTypeCode(Long id) {
        if (belongsToRemoteAsl(id)) {
            return ASL_TYPE_CODE;
        }
        return findEntityById(id).getStructureType();
    }

    @Transactional
    public StructureDto update(Long id, StructureDto structureDto) {
        if (isAslType(structureDto.getStructureType())) {
            return updateRemoteAslReferentsOnly(id, structureDto);
        }
        StructureEntity current = findEntityById(id);
        StructureType structureType = resolveStructureType(structureDto.getStructureType());
        validateCodeUniqueness(structureDto.getCode(), id);
        structureMapper.updateEntity(current, structureDto);
        applyParentValidation(current, structureType);
        return toDto(structureRepository.save(current));
    }

    @Transactional
    public void delete(Long id) {
        if (belongsToRemoteAsl(id)) {
            throw new ResponseStatusException(METHOD_NOT_ALLOWED, "L'eliminazione delle ASL da TENAPP non è consentita");
        }
        StructureEntity entity = findEntityById(id);
        boolean hasChildren = !structureRepository.findAllByParentStructureIdOrderByNameAsc(id).isEmpty();
        if (hasChildren) {
            throw new ResponseStatusException(BAD_REQUEST, "Impossibile eliminare una struttura che ha strutture figlie collegate");
        }
        structureRepository.delete(entity);
    }

    @Transactional(readOnly = true)
    public List<StructureParentOptionDto> findParentOptions(String structureTypeCode) {
        StructureType structureType = resolveStructureType(structureTypeCode);
        if (structureType.getParentTypeCode() == null) {
            return List.of();
        }

        if (HOSPITAL_TYPE_CODE.equalsIgnoreCase(structureType.getCode())) {
            return findAllRemoteAsls(null, null, null, Boolean.TRUE).stream()
                    .map(this::toParentOptionDto)
                    .toList();
        }

        return structureRepository.findAllByStructureTypeOrderByNameAsc(structureType.getParentTypeCode()).stream()
                .map(structureMapper::toParentOptionDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StructureTypeDto> findSupportedTypes() {
        return structureTypeRegistry.findAll().stream()
                .map(structureMapper::toTypeDto)
                .toList();
    }

    private List<StructureEntity> resolveEntities(String structureTypeCode, Long parentStructureId) {
        if (structureTypeCode != null && !structureTypeCode.isBlank()) {
            StructureType structureType = resolveStructureType(structureTypeCode);
            if (parentStructureId != null) {
                return structureRepository.findAllByStructureTypeAndParentStructureIdOrderByNameAsc(structureType.getCode(), parentStructureId);
            }
            return structureRepository.findAllByStructureTypeOrderByNameAsc(structureType.getCode());
        }

        if (parentStructureId != null) {
            return structureRepository.findAllByParentStructureIdOrderByNameAsc(parentStructureId);
        }

        return structureRepository.findAll().stream()
                .sorted(structureImportanceComparator())
                .toList();
    }

    private List<StructureDto> findAllRemoteAsls(String code, String name, String city, Boolean active) {
        return dashboardAslClient.findAllAssociated().stream()
                .map(asl -> buildRemoteAslDto(asl.getId()))
                .filter(dto -> matchesFilter(dto.getCode(), code))
                .filter(dto -> matchesFilter(dto.getName(), name))
                .filter(dto -> matchesFilter(dto.getCity(), city))
                .filter(dto -> active == null || dto.isActive() == active)
                .sorted(Comparator.comparing(StructureDto::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private StructureDto findRemoteAslById(Long id) {
        if (id == null) {
            throw new ResponseStatusException(NOT_FOUND, "Struttura non trovata");
        }
        return buildRemoteAslDto(id);
    }

    private StructureDto updateRemoteAslReferentsOnly(Long id, StructureDto structureDto) {
        StructureDto remoteAsl = findRemoteAslById(id);
        StructureEntity localShadow = structureRepository.findByCode(remoteAsl.getCode())
                .orElseGet(() -> createAslShadowEntity(remoteAsl));

        localShadow.setReferents(mapReferentDtos(structureDto.getReferents()));
        StructureEntity saved = structureRepository.save(localShadow);

        StructureDto refreshed = buildRemoteAslDto(id);
        refreshed.setReferents(structureMapper.toDto(saved, null).getReferents());
        return refreshed;
    }

    private StructureDto buildRemoteAslDto(Long remoteAslId) {
        ASLDto remoteDetail = Objects.requireNonNull(ticketAslClient.findById(remoteAslId), "ASL remota non trovata");
        StructureType structureType = structureTypeRegistry.getRequiredByCode(ASL_TYPE_CODE);
        StructureEntity localShadow = remoteDetail.getCodiceAzienda() == null
                ? null
                : structureRepository.findByCode(remoteDetail.getCodiceAzienda()).orElse(null);

        StructureDto dto = new StructureDto();
        dto.setId(remoteDetail.getId());
        dto.setCode(remoteDetail.getCodiceAzienda());
        dto.setName(remoteDetail.getDenominazioneAzienda());
        dto.setSelectionLabel(remoteDetail.getDenominazioneAzienda() + " - " + structureType.getDescription());
        dto.setDescription(localShadow != null ? localShadow.getDescription() : null);
        dto.setAddress(remoteDetail.getIndirizzo());
        dto.setCap(remoteDetail.getCap());
        dto.setCityId(remoteDetail.getCityId());
        // Se abbiamo una cityId, cerchiamo di risolvere provincia e regione per pre-popolare i campi nel wizard
        try {
            Long cityId = remoteDetail.getCityId();
            if (cityId != null) {
                DashboardCityDto city = dashboardGeographyService.findCityById(cityId);
                if (city != null) {
                    dto.setCity(city.getName());
                    Long provinceId = city.getProvinceId();
                    dto.setProvinceId(provinceId);
                    if (provinceId != null) {
                        DashboardProvinceDto province = dashboardGeographyService.findProvinceById(provinceId);
                        if (province != null) {
                            dto.setProvince(province.getName());
                            Long regionId = province.getRegionId();
                            dto.setRegionId(regionId);
                            if (regionId != null) {
                                DashboardRegionDto region = dashboardGeographyService.findRegionById(regionId);
                                if (region != null) {
                                    dto.setRegion(region.getName());
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception ex) {
            // Non blocchiamo l'operazione se il servizio di geografia non è disponibile; logghiamo per debugging
            // il flusso prosegue con cityId eventualmente valorizzato ma senza parent geografici
            org.slf4j.LoggerFactory.getLogger(StructureService.class).warn("Impossibile recuperare dati geografici per ASL id={}", remoteAslId, ex);
        }
        dto.setPhone(remoteDetail.getTelefono());
        dto.setEmail(remoteDetail.getEmail());
        dto.setActive(localShadow == null || Boolean.TRUE.equals(localShadow.getActive()));
        dto.setStructureType(structureType.getCode());
        dto.setStructureTypeDescription(structureType.getDescription());
        dto.setFunctionDescription(structureType.getFunctionDescription());
        dto.setStructureTypeDisplayOrder(structureType.getDisplayOrder());
        dto.setParentStructureId(null);
        dto.setParentStructureName(null);
        dto.setReferents(localShadow == null ? new ArrayList<>() : structureMapper.toDto(localShadow, null).getReferents());
        dto.setPharmacies(new ArrayList<>());
        return dto;
    }

    private StructureEntity createAslShadowEntity(StructureDto remoteAsl) {
        StructureEntity entity = new StructureEntity();
        entity.setCode(remoteAsl.getCode());
        entity.setName(remoteAsl.getName());
        entity.setDescription(remoteAsl.getDescription());
        entity.setAddress(remoteAsl.getAddress());
        entity.setCap(remoteAsl.getCap());
        entity.setCityId(remoteAsl.getCityId());
        entity.setCity(remoteAsl.getCity());
        entity.setProvinceId(remoteAsl.getProvinceId());
        entity.setProvince(remoteAsl.getProvince());
        entity.setRegionId(remoteAsl.getRegionId());
        entity.setRegion(remoteAsl.getRegion());
        entity.setPhone(remoteAsl.getPhone());
        entity.setEmail(remoteAsl.getEmail());
        entity.setActive(true);
        entity.setStructureType(ASL_TYPE_CODE);
        entity.setReferents(new ArrayList<>());
        entity.setPharmacies(new ArrayList<>());
        return entity;
    }

    private List<com.qtm.tenants.referent.entity.ReferentEntity> mapReferentDtos(List<ReferentDto> referents) {
        StructureDto referentCarrier = new StructureDto();
        referentCarrier.setCode("TEMP");
        referentCarrier.setName("TEMP");
        referentCarrier.setAddress("TEMP");
        referentCarrier.setStructureType(ASL_TYPE_CODE);
        referentCarrier.setReferents(referents == null ? List.of() : referents);
        return structureMapper.toEntity(referentCarrier).getReferents();
    }

    private StructureParentOptionDto toParentOptionDto(StructureDto dto) {
        return new StructureParentOptionDto(
                Objects.requireNonNull(dto.getId(), "ASL remota senza id"),
                dto.getCode(),
                dto.getName(),
                dto.getStructureType(),
                dto.getStructureTypeDescription()
        );
    }

    private boolean isAslType(String structureTypeCode) {
        return ASL_TYPE_CODE.equalsIgnoreCase(structureTypeCode == null ? "" : structureTypeCode.trim());
    }

    private boolean belongsToRemoteAsl(Long id) {
        if (id == null) {
            return false;
        }
        return dashboardAslClient.findAllAssociated().stream()
                .map(ASLDto::getId)
                .anyMatch(id::equals);
    }

    private List<StructureDto> toDtos(List<StructureEntity> entities) {
        Set<Long> parentIds = entities.stream()
                .map(StructureEntity::getParentStructureId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, String> parentNamesById = structureRepository.findAllById(parentIds).stream()
                .collect(Collectors.toMap(StructureEntity::getId, StructureEntity::getName, (left, right) -> left, LinkedHashMap::new));

        return entities.stream()
                .map(entity -> structureMapper.toDto(entity, parentNamesById.get(entity.getParentStructureId())))
                .toList();
    }

    private StructureDto toDto(StructureEntity entity) {
        String parentName = entity.getParentStructureId() == null
                ? null
                : structureRepository.findById(entity.getParentStructureId()).map(StructureEntity::getName).orElse(null);
        return structureMapper.toDto(entity, parentName);
    }

    private void applyParentValidation(StructureEntity entity, StructureType structureType) {
        String expectedParentTypeCode = structureType.getParentTypeCode();
        Long parentStructureId = entity.getParentStructureId();

        if (expectedParentTypeCode == null) {
            entity.setParentStructureId(null);
            return;
        }

        if (parentStructureId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "La struttura di tipo " + structureType.getDescription() + " richiede una struttura parent");
        }

        StructureEntity parent = findEntityById(parentStructureId);
        if (!expectedParentTypeCode.equalsIgnoreCase(parent.getStructureType())) {
            StructureType expectedParentType = structureTypeRegistry.getRequiredByCode(expectedParentTypeCode);
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "La struttura parent deve essere di tipo " + expectedParentType.getDescription()
            );
        }
    }

    private void validateCodeUniqueness(String code, Long currentId) {
        if (code == null || code.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Codice struttura obbligatorio");
        }

        structureRepository.findByCode(code.trim())
                .ifPresent(existing -> {
                    if (currentId == null || !existing.getId().equals(currentId)) {
                        throw new ResponseStatusException(CONFLICT, "Codice struttura gia presente: " + code);
                    }
                });
    }

    private StructureType resolveStructureType(String structureTypeCode) {
        if (structureTypeCode == null || structureTypeCode.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Tipo struttura obbligatorio");
        }

        try {
            return structureTypeRegistry.getRequiredByCode(structureTypeCode);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, exception.getMessage());
        }
    }

    private StructureEntity findEntityById(Long id) {
        return structureRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Struttura non trovata"));
    }

    private boolean matchesFilter(String value, String filter) {
        if (filter == null || filter.isBlank()) {
            return true;
        }

        return value != null && value.toLowerCase().contains(filter.trim().toLowerCase());
    }

    private Comparator<StructureEntity> structureImportanceComparator() {
        return Comparator
                .comparingInt(this::resolveDisplayOrder)
                .thenComparing(StructureEntity::getName, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(StructureEntity::getCode, String.CASE_INSENSITIVE_ORDER);
    }

    private int resolveDisplayOrder(StructureEntity entity) {
        if (entity.getStructureType() == null || entity.getStructureType().isBlank()) {
            return Integer.MAX_VALUE;
        }

        return structureTypeRegistry.findByCode(entity.getStructureType())
                .map(StructureType::getDisplayOrder)
                .orElse(Integer.MAX_VALUE);
    }
}
