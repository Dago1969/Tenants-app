package com.qtm.tenants.structure.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Aggiunge la colonna persistente per il calendario/orari di servizio delle strutture farmacia.
 */
@Component
@RequiredArgsConstructor
@Order(1)
public class StructureServiceCalendarSchemaMigration implements CommandLineRunner {

    private static final String TABLE_NAME = "structures";
    private static final String COLUMN_NAME = "service_calendar_hours";

    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        if (!tableExists(TABLE_NAME) || columnExists(TABLE_NAME, COLUMN_NAME)) {
            return;
        }

        jdbcTemplate.execute("ALTER TABLE structures ADD COLUMN service_calendar_hours TEXT NULL");
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