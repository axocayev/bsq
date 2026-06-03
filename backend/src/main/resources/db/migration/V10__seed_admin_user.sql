-- Initial ADMIN account: username=admin, password=Admin123! (BCrypt hashed)
INSERT INTO users (username, email, password_hash, full_name, role, school_id, is_active)
VALUES (
    'admin',
    'admin@bsq.az',
    '$2b$12$RqNPYJ5iKtaJ1Dq0DMAWmOUwVW6X9NptCI9qELGdABB/ybn8cclJy',
    'System Administrator',
    'ADMIN',
    NULL,
    TRUE
);
