package com.qtm.tenants.module.config;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Migra le relazioni dei moduli da module_id a module_code per usare code come chiave applicativa persistita.
 */
@Component
@RequiredArgsConstructor
@Order(0)
public class ModuleCodeSchemaMigration implements CommandLineRunner {

    private static final String TABLE_NAME = "module_role_authorizations";
    private static final String MODULE_CODE_COLUMN = "module_code";
    private static final String MODULE_ID_COLUMN = "module_id";
    private static final String MODULE_CODE_UNIQUE = "uk_module_role_authorizations_module_code_role";
    private static final String PRIMARY_KEY = "PRIMARY";
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        if (!tableExists(TABLE_NAME)) {
            return;
        }

        if (!columnExists(TABLE_NAME, MODULE_CODE_COLUMN)) {
            jdbcTemplate.execute("ALTER TABLE module_role_authorizations ADD COLUMN module_code VARCHAR(255) NULL");
        }

        if (columnExists(TABLE_NAME, MODULE_ID_COLUMN)) {
            jdbcTemplate.execute(
                "UPDATE module_role_authorizations mra "
                    + "JOIN modules m ON mra.module_id = m.id "
                    + "SET mra.module_code = m.code "
                    + "WHERE mra.module_code IS NULL"
            );
            jdbcTemplate.execute("ALTER TABLE module_role_authorizations MODIFY COLUMN module_id BIGINT NULL");
        }

        jdbcTemplate.execute(
            "DELETE duplicate_field_authorizations FROM field_authorizations duplicate_field_authorizations "
                + "JOIN module_role_authorizations duplicate_rows "
                + "ON duplicate_field_authorizations.module_role_authorization_id = duplicate_rows.id "
                + "JOIN module_role_authorizations keeper_rows "
                + "ON duplicate_rows.role_id = keeper_rows.role_id "
                + "AND COALESCE(duplicate_rows.module_code, '') = COALESCE(keeper_rows.module_code, '') "
                + "AND duplicate_rows.id > keeper_rows.id "
                + "JOIN field_authorizations keeper_field_authorizations "
                + "ON keeper_field_authorizations.module_role_authorization_id = keeper_rows.id "
                + "AND keeper_field_authorizations.entity_name = duplicate_field_authorizations.entity_name "
                + "AND keeper_field_authorizations.field_name = duplicate_field_authorizations.field_name"
        );

        jdbcTemplate.execute(
            "UPDATE field_authorizations child_rows "
                + "JOIN module_role_authorizations duplicate_rows "
                + "ON child_rows.module_role_authorization_id = duplicate_rows.id "
                + "JOIN module_role_authorizations keeper_rows "
                + "ON duplicate_rows.role_id = keeper_rows.role_id "
                + "AND COALESCE(duplicate_rows.module_code, '') = COALESCE(keeper_rows.module_code, '') "
                + "AND duplicate_rows.id > keeper_rows.id "
                + "SET child_rows.module_role_authorization_id = keeper_rows.id"
        );

        jdbcTemplate.execute(
            "DELETE duplicate_rows FROM module_role_authorizations duplicate_rows "
                + "JOIN module_role_authorizations keeper_rows "
                + "ON duplicate_rows.role_id = keeper_rows.role_id "
                + "AND COALESCE(duplicate_rows.module_code, '') = COALESCE(keeper_rows.module_code, '') "
                + "AND duplicate_rows.id > keeper_rows.id"
        );

        if (!constraintExists(TABLE_NAME, MODULE_CODE_UNIQUE)) {
            jdbcTemplate.execute(
                "ALTER TABLE module_role_authorizations "
                    + "ADD CONSTRAINT uk_module_role_authorizations_module_code_role UNIQUE (module_code, role_id)"
            );
        }

        jdbcTemplate.execute("ALTER TABLE module_role_authorizations MODIFY COLUMN module_code VARCHAR(255) NOT NULL");

        if (columnExists(TABLE_NAME, MODULE_ID_COLUMN)) {
            dropForeignKeys(TABLE_NAME, MODULE_ID_COLUMN);
            dropIndexes(TABLE_NAME, MODULE_ID_COLUMN);
            jdbcTemplate.execute("ALTER TABLE module_role_authorizations DROP COLUMN module_id");
        }
    }

    private boolean tableExists(String tableName) {
        return count(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
            tableName
        ) > 0;
    }

    private boolean columnExists(String tableName, String columnName) {
        return count(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
            tableName,
            columnName
        ) > 0;
    }

    private boolean constraintExists(String tableName, String constraintName) {
        return count(
            "SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = ?",
            tableName,
            constraintName
        ) > 0;
    }

    private void dropForeignKeys(String tableName, String columnName) {
        // Remove legacy FKs before dropping the old module_id column.
        findForeignKeys(tableName, columnName)
            .forEach(constraintName -> jdbcTemplate.execute(
                "ALTER TABLE " + tableName + " DROP FOREIGN KEY `" + constraintName + "`"
            ));
    }

    private void dropIndexes(String tableName, String columnName) {
        findIndexes(tableName, columnName).stream()
            .filter(indexName -> !PRIMARY_KEY.equalsIgnoreCase(indexName))
            .forEach(indexName -> jdbcTemplate.execute(
                "ALTER TABLE " + tableName + " DROP INDEX `" + indexName + "`"
            ));
    }

    private List<String> findForeignKeys(String tableName, String columnName) {
        return jdbcTemplate.queryForList(
            "SELECT DISTINCT constraint_name "
                + "FROM information_schema.key_column_usage "
                + "WHERE table_schema = DATABASE() "
                + "AND table_name = ? "
                + "AND column_name = ? "
                + "AND referenced_table_name IS NOT NULL",
            String.class,
            tableName,
            columnName
        );
    }

    private List<String> findIndexes(String tableName, String columnName) {
        return jdbcTemplate.queryForList(
            "SELECT DISTINCT index_name "
                + "FROM information_schema.statistics "
                + "WHERE table_schema = DATABASE() "
                + "AND table_name = ? "
                + "AND column_name = ?",
            String.class,
            tableName,
            columnName
        );
    }

    private int count(String sql, Object... args) {
        Integer value = jdbcTemplate.queryForObject(sql, Integer.class, args);
        return value == null ? 0 : value;
    }
}