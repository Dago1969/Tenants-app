package com.qtm.tenants.doctor.mapper;

import com.qtm.tenants.doctor.dto.DoctorDto;
import com.qtm.tenants.doctor.entity.DoctorEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper dottore entity/dto.
 */
@Component
public class DoctorMapper {

    public DoctorDto toDto(DoctorEntity entity) {
        DoctorDto dto = new DoctorDto();
        dto.setId(entity.getId());
        dto.setDoctorFlyerId(entity.getDoctorFlyerId());
        dto.setFullName(entity.getFullName());
        dto.setEmail(entity.getEmail());
        dto.setPrimaryPhone(entity.getPrimaryPhone());
        dto.setSecondaryPhone(entity.getSecondaryPhone());
        dto.setRegionId(entity.getRegionId());
        dto.setRegion(entity.getRegion());
        dto.setProvinceId(entity.getProvinceId());
        dto.setProvince(entity.getProvince());
        dto.setCityId(entity.getCityId());
        dto.setCity(entity.getCity());
        dto.setDeliveryAddress(entity.getDeliveryAddress());
        dto.setSecondaryAddresses(entity.getSecondaryAddresses());
        dto.setStructureId(entity.getStructureId());
        dto.setSpecialization(entity.getSpecialization());
        dto.setDataProcessingConsent(entity.getDataProcessingConsent());
        dto.setDataProcessingConsentDateTime(entity.getDataProcessingConsentDateTime());
        dto.setDataProcessingConsentRevocationLog(entity.getDataProcessingConsentRevocationLog());
        dto.setAdditionalConsents(entity.getAdditionalConsents());
        return dto;
    }

    public DoctorEntity toEntity(DoctorDto dto) {
        DoctorEntity entity = new DoctorEntity();
        entity.setId(dto.getId());
        entity.setDoctorFlyerId(dto.getDoctorFlyerId());
        entity.setFullName(dto.getFullName());
        entity.setEmail(dto.getEmail());
        entity.setPrimaryPhone(dto.getPrimaryPhone());
        entity.setSecondaryPhone(dto.getSecondaryPhone());
        entity.setRegionId(dto.getRegionId());
        entity.setRegion(dto.getRegion());
        entity.setProvinceId(dto.getProvinceId());
        entity.setProvince(dto.getProvince());
        entity.setCityId(dto.getCityId());
        entity.setCity(dto.getCity());
        entity.setDeliveryAddress(dto.getDeliveryAddress());
        entity.setSecondaryAddresses(dto.getSecondaryAddresses());
        entity.setStructureId(dto.getStructureId());
        entity.setSpecialization(dto.getSpecialization());
        entity.setDataProcessingConsent(dto.getDataProcessingConsent());
        entity.setDataProcessingConsentDateTime(dto.getDataProcessingConsentDateTime());
        entity.setDataProcessingConsentRevocationLog(dto.getDataProcessingConsentRevocationLog());
        entity.setAdditionalConsents(dto.getAdditionalConsents());
        return entity;
    }
}
