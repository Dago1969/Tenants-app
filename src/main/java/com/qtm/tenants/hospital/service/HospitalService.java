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
    private final HospitalRepository hospitalRepository;
    private final HospitalMapper hospitalMapper;

    @Transactional
    public HospitalDto create(HospitalDto hospitalDto) {
        if (hospitalRepository.existsByCode(hospitalDto.getCode())) {
            throw new ResponseStatusException(BAD_REQUEST, "Codice già esistente");
        }
        HospitalEntity entity = hospitalMapper.toEntity(hospitalDto);
        HospitalEntity saved = hospitalRepository.save(entity);
        return hospitalMapper.toDto(saved, null);
    }

    @Transactional(readOnly = true)
    public List<HospitalDto> findAll() {
        List<HospitalEntity> entities = hospitalRepository.findAllByActiveTrueOrderByNameAsc();
        return entities.stream().map(e -> hospitalMapper.toDto(e, null)).toList();
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
}