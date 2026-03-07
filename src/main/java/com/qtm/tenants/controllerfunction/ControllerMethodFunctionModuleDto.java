package com.qtm.tenants.controllerfunction;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * DTO pagina configurazione mapping funzioni per singolo modulo.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ControllerMethodFunctionModuleDto {

    private String moduleCode;
    private String moduleName;
    private List<ControllerMethodFunctionDto> commonMethods;
    private List<ControllerMethodFunctionDto> customMethods;
}
