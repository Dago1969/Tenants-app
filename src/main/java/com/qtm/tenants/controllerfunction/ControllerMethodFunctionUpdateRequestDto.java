package com.qtm.tenants.controllerfunction;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * DTO richiesta aggiornamento mapping metodi controller di un modulo.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ControllerMethodFunctionUpdateRequestDto {

    private List<ControllerMethodFunctionDto> methods;
}
