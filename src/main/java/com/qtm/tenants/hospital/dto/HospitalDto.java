package com.qtm.tenants.hospital.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.qtm.tenants.referent.dto.ReferentDto;
import java.util.List;

/**
 * DTO ospedale dedicato, duplicato da StructureDto.
 */
@Getter
@Setter
@NoArgsConstructor
public class HospitalDto {
    private Long id;
    private String code;
    private String name;
    private String selectionLabel;
    private String description;
    private String address;
    private String cap;
    private Long cityId;
    private String city;
    private Long provinceId;
    private String province;
    private Long regionId;
    private String region;
    private String phone;
    private String email;
    private Integer status;
    private Long parentHospitalId;
    private String parentHospitalName;
    private List<ReferentDto> referents;
    private List<HospitalDto> linkedHospitals;
}