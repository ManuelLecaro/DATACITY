INSERT INTO main_user (id, password, is_superuser, username, first_name, last_name, email, is_staff, is_active, identity_card, phone_number, user_type, institution, created_by, updated_by, date_joined, date_updated) VALUES
(1, 'pbkdf2_sha256$36000$dhqxoejz7cPU$y2UArD3//0+1ltQlMfeUM7NTK5oY/76FHD4YxquLg7o=', true, 'admin', 'Fernando', 'Sanchez', 'admin@example.com', true, true, '0929858736', '0969488119', 4, 'ESPOL', 'Fernando Sánchez', 'Fernando Sánchez', current_timestamp, current_timestamp)
(2, 'pbkdf2_sha256$36000$dhqxoejz7cPU$y2UArD3//0+1ltQlMfeUM7NTK5oY/76FHD4YxquLg7o=', false, 'invitado', 'Juan', 'Piguave', 'guest@example.com', false, true, '1314344985', '0995966700', 3, 'UG', 'Fernando Sánchez', 'Fernando Sánchez', current_timestamp, current_timestamp)
(3, 'pbkdf2_sha256$36000$dhqxoejz7cPU$y2UArD3//0+1ltQlMfeUM7NTK5oY/76FHD4YxquLg7o=', false, 'cliente', 'Carmen', 'Zambrano', 'customer@example.com', false, true, '1201333398', '0984396325', 2, 'UNEMI', 'Fernando Sánchez', 'Fernando Sánchez', current_timestamp, current_timestamp)
(4, 'pbkdf2_sha256$36000$dhqxoejz7cPU$y2UArD3//0+1ltQlMfeUM7NTK5oY/76FHD4YxquLg7o=', false, 'investigador', 'Carlos', 'Manosalvas', 'researcher@example.com', false, true, '0920335567', '0984487328', 1, 'ESPOL', 'Fernando Sánchez', 'Fernando Sánchez', current_timestamp, current_timestamp);
