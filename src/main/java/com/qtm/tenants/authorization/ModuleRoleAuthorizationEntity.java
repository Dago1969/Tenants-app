package com.qtm.tenants.authorization;

import com.qtm.tenants.module.entity.ModuleEntity;
import com.qtm.tenants.role.entity.RoleEntity;
import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Autorizzazione aggregata per coppia modulo+ruolo.
 */
@Entity
@Table(name = "module_role_authorizations", uniqueConstraints = {
    @UniqueConstraint(name = "uk_module_role_authorizations_module_code_role", columnNames = {"module_code", "role_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class ModuleRoleAuthorizationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "module_code",
        referencedColumnName = "code",
        nullable = false,
        foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT)
    )
    private ModuleEntity module;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", referencedColumnName = "id", nullable = false)
    private RoleEntity role;

    @Column(name = "authorization", nullable = false)
    private AuthorizationScope authorization;
}
