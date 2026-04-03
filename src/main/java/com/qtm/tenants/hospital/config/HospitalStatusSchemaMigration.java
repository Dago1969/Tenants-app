package com.qtm.tenants.hospital.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Allinea la tabella hospitals al nuovo modello status, convertendo i dati legacy della colonna active.
 */
@Slf4j
@Component
@RequiredArgsConstructor
//@Order(0)
public class HospitalStatusSchemaMigration implements CommandLineRunner {

    private static final String TABLE_NAME = "hospitals";
    private static final String STATUS_COLUMN = "status";
    private static final String ACTIVE_COLUMN = "active";
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        if (!tableExists(TABLE_NAME) || !columnExists(TABLE_NAME, STATUS_COLUMN)) {
            return;
        }

        if (columnExists(TABLE_NAME, ACTIVE_COLUMN)) {
            jdbcTemplate.execute(
                "UPDATE hospitals "
                    + "SET status = CASE "
                    + "WHEN active = 1 THEN 1 "
                    + "WHEN active = 0 THEN 0 "
                    + "ELSE 1 END "
                    + "WHERE status IS NULL"
            );
            jdbcTemplate.execute("ALTER TABLE hospitals DROP COLUMN active");
            log.info("[HospitalStatusSchemaMigration] Legacy column active migrated to status on hospitals table.");
        }

        jdbcTemplate.execute("UPDATE hospitals SET status = 1 WHERE status IS NULL");
        jdbcTemplate.execute("ALTER TABLE hospitals MODIFY COLUMN status INT NOT NULL DEFAULT 1");
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

    private int count(String sql, Object... args) {
        Integer value = jdbcTemplate.queryForObject(sql, Integer.class, args);
        return value == null ? 0 : value;
    }
}