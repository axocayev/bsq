-- Ensure ADMIN account exists: username=admin, password=Admin123! (BCrypt)
INSERT INTO users (username, email, password_hash, full_name, role, school_id, is_active)
VALUES (
    'admin',
    'admin@bsq.az',
    '$2b$12$T05XrZfiF.qe/TfxINFgJ.7bwGu0fGaDglAdPc/eF0.R28UM7XP/K',
    'System Administrator',
    'ADMIN',
    NULL,
    TRUE
)
ON CONFLICT (username) DO NOTHING;
