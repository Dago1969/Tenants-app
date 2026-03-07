package com.qtm.tenants.controllerfunction;

import org.springframework.stereotype.Component;

/**
 * Mapper entity/dto per i mapping metodo controller -> funzione.
 */
@Component
public class ControllerMethodFunctionMapper {

    public ControllerMethodFunctionDto toDto(
            ControllerMethodFunctionEntity entity,
            String functionName,
            boolean commonFunction
    ) {
        return new ControllerMethodFunctionDto(
                entity.getId(),
                entity.getModuleCode(),
                entity.getMethodName(),
                entity.getFunctionCode(),
                functionName,
                commonFunction
        );
    }
}
