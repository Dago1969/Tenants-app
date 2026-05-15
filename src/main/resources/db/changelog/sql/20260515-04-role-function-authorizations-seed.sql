-- Popola le autorizzazioni funzione+modulo+ruolo per i moduli di amministrazione
-- ROLE module
INSERT IGNORE INTO function_module_role_authorizations (function_code, module_code, role_id, authorization) VALUES
  ('CREATE', 'ROLE', 'ADMIN', 'FULL_EDIT'),
  ('CREATE', 'ROLE', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('READ', 'ROLE', 'ADMIN', 'FULL_EDIT'),
  ('READ', 'ROLE', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('SEARCH', 'ROLE', 'ADMIN', 'FULL_EDIT'),
  ('SEARCH', 'ROLE', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('UPDATE', 'ROLE', 'ADMIN', 'FULL_EDIT'),
  ('UPDATE', 'ROLE', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('DELETE', 'ROLE', 'ADMIN', 'FULL_EDIT'),
  ('DELETE', 'ROLE', 'SUPER_ADMIN', 'FULL_EDIT');

-- MODULE module
INSERT IGNORE INTO function_module_role_authorizations (function_code, module_code, role_id, authorization) VALUES
  ('CREATE', 'MODULE', 'ADMIN', 'FULL_EDIT'),
  ('CREATE', 'MODULE', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('READ', 'MODULE', 'ADMIN', 'FULL_EDIT'),
  ('READ', 'MODULE', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('SEARCH', 'MODULE', 'ADMIN', 'FULL_EDIT'),
  ('SEARCH', 'MODULE', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('UPDATE', 'MODULE', 'ADMIN', 'FULL_EDIT'),
  ('UPDATE', 'MODULE', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('DELETE', 'MODULE', 'ADMIN', 'FULL_EDIT'),
  ('DELETE', 'MODULE', 'SUPER_ADMIN', 'FULL_EDIT');

-- FUNCTION module
INSERT IGNORE INTO function_module_role_authorizations (function_code, module_code, role_id, authorization) VALUES
  ('CREATE', 'FUNCTION', 'ADMIN', 'FULL_EDIT'),
  ('CREATE', 'FUNCTION', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('READ', 'FUNCTION', 'ADMIN', 'FULL_EDIT'),
  ('READ', 'FUNCTION', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('SEARCH', 'FUNCTION', 'ADMIN', 'FULL_EDIT'),
  ('SEARCH', 'FUNCTION', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('UPDATE', 'FUNCTION', 'ADMIN', 'FULL_EDIT'),
  ('UPDATE', 'FUNCTION', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('DELETE', 'FUNCTION', 'ADMIN', 'FULL_EDIT'),
  ('DELETE', 'FUNCTION', 'SUPER_ADMIN', 'FULL_EDIT');

-- THERAPEUTIC_PLAN module
INSERT IGNORE INTO function_module_role_authorizations (function_code, module_code, role_id, authorization) VALUES
  ('CREATE', 'THERAPEUTIC_PLAN', 'ADMIN', 'FULL_EDIT'),
  ('CREATE', 'THERAPEUTIC_PLAN', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('READ', 'THERAPEUTIC_PLAN', 'ADMIN', 'FULL_EDIT'),
  ('READ', 'THERAPEUTIC_PLAN', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('SEARCH', 'THERAPEUTIC_PLAN', 'ADMIN', 'FULL_EDIT'),
  ('SEARCH', 'THERAPEUTIC_PLAN', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('APPROVE', 'THERAPEUTIC_PLAN', 'ADMIN', 'FULL_EDIT'),
  ('APPROVE', 'THERAPEUTIC_PLAN', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('UPDATE', 'THERAPEUTIC_PLAN', 'ADMIN', 'FULL_EDIT'),
  ('UPDATE', 'THERAPEUTIC_PLAN', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('DELETE', 'THERAPEUTIC_PLAN', 'ADMIN', 'FULL_EDIT'),
  ('DELETE', 'THERAPEUTIC_PLAN', 'SUPER_ADMIN', 'FULL_EDIT');
