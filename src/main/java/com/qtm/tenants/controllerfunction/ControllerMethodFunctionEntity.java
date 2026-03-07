package com.qtm.tenants.controllerfunction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity di configurazione metodo esposto controller -> funzione autorizzabile per modulo.
 */
@Entity
@Table(
        name = "controller_method_functions",
        uniqueConstraints = @UniqueConstraint(name = "uk_controller_method_function", columnNames = {"module_code", "method_name"})
)
@Getter
@Setter
@NoArgsConstructor
public class ControllerMethodFunctionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "module_code", nullable = false, length = 100)
    private String moduleCode;

    @Column(name = "method_name", nullable = false, length = 150)
    private String methodName;

    @Column(name = "function_code", nullable = false, length = 100)
    private String functionCode;
}
