package com.qtm.tenants.referent.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO per il contatto referente di una struttura.
 */
@Getter
@Setter
@NoArgsConstructor
public class ReferentDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String role;
    private String phone;
    private String email;
}
