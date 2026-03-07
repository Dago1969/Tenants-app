package com.qtm.tenants.authorization;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
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
 * Autorizzazione per singolo attributo dell'entity applicativa.
 */
@Entity
@Table(name = "field_authorizations", uniqueConstraints = {
        @UniqueConstraint(name = "uk_field_authorizations_module_role_entity_field", columnNames = {
                "module_role_authorization_id", "entity_name", "field_name"
        })
})
@Getter
@Setter
@NoArgsConstructor
public class FieldAuthorizationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "module_role_authorization_id", nullable = false)
    private ModuleRoleAuthorizationEntity moduleRoleAuthorization;

    @Column(name = "entity_name", nullable = false)
    private String entityName;

    @Column(name = "field_name", nullable = false)
    private String fieldName;

    @Column(name = "authorization", nullable = false)
    private AuthorizationScope authorization;
}
