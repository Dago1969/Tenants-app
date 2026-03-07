-- Migrazione manuale di riferimento: MODULE usa code come chiave logica e join persistita.
ALTER TABLE module_role_authorizations ADD COLUMN module_code VARCHAR(255) NULL;
UPDATE module_role_authorizations mra
JOIN modules m ON mra.module_id = m.id
SET mra.module_code = m.code
WHERE mra.module_code IS NULL;
ALTER TABLE module_role_authorizations MODIFY COLUMN module_id BIGINT NULL;
DELETE duplicate_field_authorizations FROM field_authorizations duplicate_field_authorizations
JOIN module_role_authorizations duplicate_rows
  ON duplicate_field_authorizations.module_role_authorization_id = duplicate_rows.id
JOIN module_role_authorizations keeper_rows
  ON duplicate_rows.role_id = keeper_rows.role_id
 AND COALESCE(duplicate_rows.module_code, '') = COALESCE(keeper_rows.module_code, '')
 AND duplicate_rows.id > keeper_rows.id
JOIN field_authorizations keeper_field_authorizations
  ON keeper_field_authorizations.module_role_authorization_id = keeper_rows.id
 AND keeper_field_authorizations.entity_name = duplicate_field_authorizations.entity_name
 AND keeper_field_authorizations.field_name = duplicate_field_authorizations.field_name;
UPDATE field_authorizations child_rows
JOIN module_role_authorizations duplicate_rows
  ON child_rows.module_role_authorization_id = duplicate_rows.id
JOIN module_role_authorizations keeper_rows
  ON duplicate_rows.role_id = keeper_rows.role_id
 AND COALESCE(duplicate_rows.module_code, '') = COALESCE(keeper_rows.module_code, '')
 AND duplicate_rows.id > keeper_rows.id
SET child_rows.module_role_authorization_id = keeper_rows.id;
DELETE duplicate_rows FROM module_role_authorizations duplicate_rows
JOIN module_role_authorizations keeper_rows
  ON duplicate_rows.role_id = keeper_rows.role_id
 AND COALESCE(duplicate_rows.module_code, '') = COALESCE(keeper_rows.module_code, '')
 AND duplicate_rows.id > keeper_rows.id;
ALTER TABLE module_role_authorizations
  ADD CONSTRAINT uk_module_role_authorizations_module_code_role UNIQUE (module_code, role_id);
ALTER TABLE module_role_authorizations MODIFY COLUMN module_code VARCHAR(255) NOT NULL;

-- Il vincolo legacy su module_id deve essere rimosso prima dell'indice univoco che lo supporta.
SET @drop_module_id_fk_sql = (
  SELECT COALESCE(
    (
      SELECT CONCAT(
        'ALTER TABLE module_role_authorizations DROP FOREIGN KEY `',
        constraint_name,
        '`'
      )
      FROM information_schema.key_column_usage
      WHERE table_schema = DATABASE()
        AND table_name = 'module_role_authorizations'
        AND column_name = 'module_id'
        AND referenced_table_name IS NOT NULL
      LIMIT 1
    ),
    'SELECT 1'
  )
);
PREPARE drop_module_id_fk_stmt FROM @drop_module_id_fk_sql;
EXECUTE drop_module_id_fk_stmt;
DEALLOCATE PREPARE drop_module_id_fk_stmt;

SET @drop_module_id_index_sql = IF(
  EXISTS(
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'module_role_authorizations'
      AND index_name = 'uk_module_role_authorizations_module_role'
  ),
  'ALTER TABLE module_role_authorizations DROP INDEX `uk_module_role_authorizations_module_role`',
  'SELECT 1'
);
PREPARE drop_module_id_index_stmt FROM @drop_module_id_index_sql;
EXECUTE drop_module_id_index_stmt;
DEALLOCATE PREPARE drop_module_id_index_stmt;

SET @drop_module_id_column_sql = IF(
  EXISTS(
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'module_role_authorizations'
      AND column_name = 'module_id'
  ),
  'ALTER TABLE module_role_authorizations DROP COLUMN module_id',
  'SELECT 1'
);
PREPARE drop_module_id_column_stmt FROM @drop_module_id_column_sql;
EXECUTE drop_module_id_column_stmt;
DEALLOCATE PREPARE drop_module_id_column_stmt;