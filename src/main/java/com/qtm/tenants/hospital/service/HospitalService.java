package com.qtm.tenants.hospital.service;

import com.qtm.tenants.hospital.dto.HospitalDto;
import com.qtm.tenants.hospital.entity.HospitalEntity;
import com.qtm.tenants.hospital.mapper.HospitalMapper;
import com.qtm.tenants.hospital.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Optional;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Service CRUD ospedali dedicato.
 */
@Service
@RequiredArgsConstructor
public class HospitalService {
    private static final int STATUS_DISABLED = 0;
    private static final int STATUS_ACTIVE = 1;
    private static final int STATUS_TO_ACTIVATE = 2;

    private final HospitalRepository hospitalRepository;
    private final HospitalMapper hospitalMapper;

    @Transactional
    public HospitalDto create(HospitalDto hospitalDto) {
        if (hospitalRepository.existsByCode(hospitalDto.getCode())) {
            throw new ResponseStatusException(BAD_REQUEST, "Codice già esistente");
        }
        validateStatus(hospitalDto.getStatus());
        HospitalEntity entity = hospitalMapper.toEntity(hospitalDto);
        HospitalEntity saved = hospitalRepository.save(entity);
        return hospitalMapper.toDto(saved, null);
    }

    @Transactional(readOnly = true)
    public List<HospitalDto> findAll(String code, String name, String city, String region, Integer status) {
        Integer resolvedStatus = status == null ? STATUS_ACTIVE : status;
        validateStatus(resolvedStatus);

        List<HospitalEntity> entities = hospitalRepository.findAllByStatusOrderByNameAsc(resolvedStatus).stream()
                .filter(entity -> matchesFilter(entity.getCode(), code))
                .filter(entity -> matchesFilter(entity.getName(), name))
                .filter(entity -> matchesFilter(entity.getCity(), city))
                .filter(entity -> matchesFilter(entity.getRegion(), region))
                .toList();

        return entities.stream().map(entity -> hospitalMapper.toDto(entity, null)).toList();
    }

    @Transactional(readOnly = true)
    public HospitalDto findById(@org.springframework.lang.NonNull Long id) {
        Optional<HospitalEntity> entity = hospitalRepository.findById(id);
        return entity.map(e -> hospitalMapper.toDto(e, null)).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Ospedale non trovato"));
    }

    @Transactional
    public void delete(@org.springframework.lang.NonNull Long id) {
        hospitalRepository.deleteById(id);
    }

    private boolean matchesFilter(String value, String filter) {
        if (filter == null || filter.isBlank()) {
            return true;
        }

        return value != null && value.toLowerCase().contains(filter.trim().toLowerCase());
    }

    private void validateStatus(Integer status) {
        if (status == null) {
            return;
        }

        if (status != STATUS_DISABLED && status != STATUS_ACTIVE && status != STATUS_TO_ACTIVATE) {
            throw new ResponseStatusException(BAD_REQUEST, "Status ospedale non valido");
        }
    }
}