-- Migrazione MySQL: roles con PK stringa, rimozione colonna name,
-- aggiornamento collegamento users.role_id verso roles(id) stringa.
--
-- NOTE:
-- 1) Eseguire prima in ambiente di test.
-- 2) Fare backup del DB prima dell'esecuzione.
-- 3) Questo script e' pensato per schema corrente con:
--    - roles(id BIGINT PK, name VARCHAR UNIQUE, description ...)
--    - users(role_id BIGINT ...)

START TRANSACTION;

-- 1) Preparazione nuovo identificativo stringa ruolo usando il valore storico di name.
ALTER TABLE roles ADD COLUMN role_code VARCHAR(255) NULL;

UPDATE roles
SET role_code = COALESCE(NULLIF(TRIM(name), ''), CONCAT('ROLE_', id));

ALTER TABLE roles MODIFY role_code VARCHAR(255) NOT NULL;
ALTER TABLE roles ADD UNIQUE KEY uk_roles_role_code (role_code);

-- 2) Migrazione users.role_id su chiave stringa del ruolo.
ALTER TABLE users ADD COLUMN role_id_new VARCHAR(255) NULL;

UPDATE users u
LEFT JOIN roles r ON u.role_id = r.id
SET u.role_id_new = r.role_code;

-- 3) Sostituzione PK di roles da BIGINT a VARCHAR.
ALTER TABLE roles DROP PRIMARY KEY;
ALTER TABLE roles CHANGE COLUMN id id_old BIGINT NOT NULL;
ALTER TABLE roles CHANGE COLUMN role_code id VARCHAR(255) NOT NULL;
ALTER TABLE roles ADD PRIMARY KEY (id);

-- 4) Sostituzione colonna users.role_id e creazione FK esplicita.
ALTER TABLE users DROP COLUMN role_id;
ALTER TABLE users CHANGE COLUMN role_id_new role_id VARCHAR(255) NULL;
ALTER TABLE users ADD INDEX idx_users_role_id (role_id);
ALTER TABLE users
  ADD CONSTRAINT fk_users_role
  FOREIGN KEY (role_id) REFERENCES roles(id);

-- 5) Pulizia colonne obsolete.
ALTER TABLE roles DROP COLUMN name;
ALTER TABLE roles DROP COLUMN id_old;

COMMIT;

-- Query di controllo post-migrazione (eseguire separatamente):
-- SELECT id, description FROM roles LIMIT 20;
-- SELECT id, username, role_id FROM users LIMIT 20;
-- SHOW CREATE TABLE roles;
-- SHOW CREATE TABLE users;
