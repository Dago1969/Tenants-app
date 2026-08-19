-- Popola le autorizzazioni aggregati modulo+ruolo per ruoli base
INSERT IGNORE INTO module_role_authorizations (module_code, role_id, authorization) VALUES
  -- ADMIN access
  ('USER', 'ADMIN', 'FULL_EDIT'),
  ('PATIENT', 'ADMIN', 'FULL_EDIT'),
  ('DOCTOR', 'ADMIN', 'FULL_EDIT'),
  ('NURSE', 'ADMIN', 'FULL_EDIT'),
  ('ROLE', 'ADMIN', 'FULL_EDIT'),
  ('MODULE', 'ADMIN', 'FULL_EDIT'),
  ('FUNCTION', 'ADMIN', 'FULL_EDIT'),
  ('THERAPEUTIC_PLAN', 'ADMIN', 'FULL_EDIT'),
  ('STRUCTURE-ASL', 'ADMIN', 'FULL_EDIT'),
  ('STRUCTURE-FARMACY', 'ADMIN', 'FULL_EDIT'),
  
  -- SUPER_ADMIN access (full permissions)
  ('USER', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('PATIENT', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('DOCTOR', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('NURSE', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('ROLE', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('MODULE', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('FUNCTION', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('THERAPEUTIC_PLAN', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('STRUCTURE-ASL', 'SUPER_ADMIN', 'FULL_EDIT'),
  ('STRUCTURE-FARMACY', 'SUPER_ADMIN', 'FULL_EDIT');
