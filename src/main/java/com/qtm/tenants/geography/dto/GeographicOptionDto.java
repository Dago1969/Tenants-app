package com.qtm.tenants.geography.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * DTO minimale per popolare le select geografiche del frontend tenant.
 */
@Getter
@AllArgsConstructor
public class GeographicOptionDto {

    private Long id;
    private String name;
}