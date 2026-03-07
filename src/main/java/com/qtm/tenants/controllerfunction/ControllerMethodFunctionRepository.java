package com.qtm.tenants.controllerfunction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository JPA dei mapping metodo controller -> funzione.
 */
public interface ControllerMethodFunctionRepository extends JpaRepository<ControllerMethodFunctionEntity, Long> {

    List<ControllerMethodFunctionEntity> findAllByModuleCodeOrderByMethodNameAsc(String moduleCode);

    Optional<ControllerMethodFunctionEntity> findByModuleCodeAndMethodName(String moduleCode, String methodName);

    void deleteAllByModuleCodeAndMethodNameNotIn(String moduleCode, Collection<String> methodNames);
}
