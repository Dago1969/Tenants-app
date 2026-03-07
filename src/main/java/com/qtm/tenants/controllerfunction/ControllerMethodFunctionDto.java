package com.qtm.tenants.controllerfunction;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO singolo mapping metodo controller -> funzione per un modulo.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ControllerMethodFunctionDto {

    private Long id;
    private String moduleCode;
    private String methodName;
    private String functionCode;
    private String functionName;
    private boolean commonFunction;
}
