package com.qtm.tenants.hospital.mapper;

import com.qtm.tenants.hospital.dto.HospitalDto;
import com.qtm.tenants.hospital.entity.HospitalEntity;
import com.qtm.tenants.referent.mapper.ReferentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.ArrayList;

/**
 * Mapper entity/dto per Hospital.
 */
@Component
@RequiredArgsConstructor
public class HospitalMapper {
    @Autowired
    private ReferentMapper referentMapper;

    public HospitalDto toDto(HospitalEntity entity, String parentHospitalName) {
        HospitalDto dto = new HospitalDto();
        dto.setId(entity.getId());
        dto.setCode(entity.getCode());
        dto.setName(entity.getName());
        dto.setSelectionLabel(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setAddress(entity.getAddress());
        dto.setCap(entity.getCap());
        if (entity.getReferents() != null) {
            dto.setReferents(referentMapper.toDtoList(entity.getReferents()));
        } else {
            dto.setReferents(new ArrayList<>());
        }
        dto.setCityId(entity.getCityId());
        dto.setCity(entity.getCity());
        dto.setProvinceId(entity.getProvinceId());
        dto.setProvince(entity.getProvince());
        dto.setRegionId(entity.getRegionId());
        dto.setRegion(entity.getRegion());
        dto.setPhone(entity.getPhone());
        dto.setEmail(entity.getEmail());
        dto.setActive(Boolean.TRUE.equals(entity.getActive()));
        dto.setParentHospitalId(entity.getParentHospitalId());
        dto.setParentHospitalName(parentHospitalName);
        // linkedHospitals mapping semplificato
        dto.setLinkedHospitals(new ArrayList<>());
        return dto;
    }

    public HospitalEntity toEntity(HospitalDto dto) {
        HospitalEntity entity = new HospitalEntity();
        entity.setId(dto.getId());
        entity.setCode(dto.getCode());
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setAddress(dto.getAddress());
        entity.setCap(dto.getCap());
        entity.setCityId(dto.getCityId());
        entity.setCity(dto.getCity());
        entity.setProvinceId(dto.getProvinceId());
        entity.setProvince(dto.getProvince());
        entity.setRegionId(dto.getRegionId());
        entity.setRegion(dto.getRegion());
        entity.setPhone(dto.getPhone());
        entity.setEmail(dto.getEmail());
        entity.setActive(dto.isActive());
        entity.setParentHospitalId(dto.getParentHospitalId());
        // referents mapping semplificato
        entity.setReferents(new ArrayList<>());
        // linkedHospitals mapping semplificato
        entity.setLinkedHospitals(new ArrayList<>());
        return entity;
    }
}