package com.qtm.tenants.authorization.entity;

import com.qtm.tenants.authorization.AuthorizationScope;
import com.qtm.tenants.function.entity.FunctionEntity;
import com.qtm.tenants.module.entity.ModuleEntity;
import com.qtm.tenants.role.entity.RoleEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Relazione tra FUNCTION, MODULE, ROLE e authorization.
 */
@Entity
@Table(name = "function_module_role_authorizations",
    uniqueConstraints = @UniqueConstraint(name = "uk_fmra_func_mod_role", columnNames = {"function_code", "module_code", "role_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class FunctionModuleRoleAuthorizationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "function_code", referencedColumnName = "code", nullable = false)
    private FunctionEntity function;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "module_code", referencedColumnName = "code", nullable = false)
    private ModuleEntity module;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", referencedColumnName = "id", nullable = false)
    private RoleEntity role;

    @Enumerated(EnumType.STRING)
    @Column(name = "authorization", nullable = false)
    private AuthorizationScope authorization;
}
