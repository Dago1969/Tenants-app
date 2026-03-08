package com.qtm.tenants.medic.mapper;

import com.qtm.tenants.medic.dto.MedicDto;
import com.qtm.tenants.medic.entity.MedicEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper medico entity/dto.
 */
@Component
public class MedicMapper {

    public MedicDto toDto(MedicEntity entity) {
        MedicDto dto = new MedicDto();
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

    public MedicEntity toEntity(MedicDto dto) {
        MedicEntity entity = new MedicEntity();
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
