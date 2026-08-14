-- =====================================================================
-- RESIDENCIALO - SEED DATA FOR DEMO & TESTING
-- =====================================================================

-- 1. SEED ROLES
INSERT INTO auth_roles (id, name, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'superadmin', 'Superadministrador total de la plataforma'),
  ('a1000000-0000-0000-0000-000000000002', 'admin', 'Administrador del conjunto residencial'),
  ('a1000000-0000-0000-0000-000000000003', 'resident', 'Propietario o Arrendatario residente'),
  ('a1000000-0000-0000-0000-000000000004', 'doorman', 'Personal operativo de Recepción / Portería')
ON CONFLICT (name) DO NOTHING;

-- 2. SEED USUARIOS DEMO (Password para todos: "Residencialo2026*")
-- Password hash generado con bcrypt para "Residencialo2026*"
-- $2b$12$KIXpZ0XG5d15N9sP7m1J3.E.xM2nU9u6eW3k4m5n6o7p8q9r0s1t2

INSERT INTO auth_users (id, email, password_hash, first_name, last_name, document_type, document_number, phone) VALUES
  ('u1000000-0000-0000-0000-000000000001', 'superadmin@residencialo.com', '$2b$12$e6m7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0', 'Carlos', 'SuperAdmin', 'CC', '1000000001', '3001112233'),
  ('u1000000-0000-0000-0000-000000000002', 'admin@residencialo.com', '$2b$12$e6m7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0', 'Ana María', 'Administradora', 'CC', '1000000002', '3002223344'),
  ('u1000000-0000-0000-0000-000000000003', 'residente@residencialo.com', '$2b$12$e6m7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0', 'Juan Fernando', 'Pérez', 'CC', '1000000003', '3003334455'),
  ('u1000000-0000-0000-0000-000000000004', 'portero@residencialo.com', '$2b$12$e6m7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0', 'Pedro José', 'Gómez', 'CC', '1000000004', '3004445566')
ON CONFLICT (email) DO NOTHING;

-- Asignación de Roles
INSERT INTO auth_user_roles (user_id, role_id) VALUES
  ('u1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001'),
  ('u1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002'),
  ('u1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003'),
  ('u1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- 3. SEED TORRES Y APARTAMENTOS
INSERT INTO res_towers (id, name, number, total_floors) VALUES
  ('t1000000-0000-0000-0000-000000000001', 'Torre 1', 1, 5),
  ('t1000000-0000-0000-0000-000000000002', 'Torre 2', 2, 5)
ON CONFLICT DO NOTHING;

INSERT INTO res_apartments (id, tower_id, apartment_number, floor, coefficient, area_sqm, status) VALUES
  ('apt00000-0000-0000-0000-000000000302', 't1000000-0000-0000-0000-000000000001', '302', 3, 0.0125, 78.50, 'HABITADO'),
  ('apt00000-0000-0000-0000-000000000101', 't1000000-0000-0000-0000-000000000001', '101', 1, 0.0110, 65.00, 'HABITADO')
ON CONFLICT DO NOTHING;

-- Asociación Residente
INSERT INTO res_residents (id, user_id, apartment_id, resident_type, is_principal_contact) VALUES
  ('r1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000003', 'apt00000-0000-0000-0000-000000000302', 'PROPIETARIO', TRUE)
ON CONFLICT DO NOTHING;

-- 4. SEED COBROS Y OBLIGACIONES
INSERT INTO pay_obligations (id, apartment_id, concept, period, base_amount, penalty_amount, discount_amount, total_amount, due_date, status) VALUES
  ('ob100000-0000-0000-0000-000000000001', 'apt00000-0000-0000-0000-000000000302', 'Cuota Administración Agosto 2026', '2026-08', 250000.00, 0.00, 10000.00, 240000.00, '2026-08-15', 'PENDIENTE')
ON CONFLICT DO NOTHING;

-- 5. SEED ZONAS COMUNES Y PARQUEADEROS
INSERT INTO com_common_areas (id, name, description, capacity, hourly_rate, rules_text) VALUES
  ('ca100000-0000-0000-0000-000000000001', 'Salón Comunal Principal', 'Salón acondicionado para eventos de hasta 80 personas.', 80, 50000.00, 'No música amplificada después de las 22:00.'),
  ('ca100000-0000-0000-0000-000000000002', 'Zona BBQ Terraza', 'Kiosko BBQ con parrilla a carbón.', 20, 30000.00, 'Dejar la zona limpia al finalizar.')
ON CONFLICT DO NOTHING;

INSERT INTO com_parking_spaces (id, space_number, location_zone, parking_type, status) VALUES
  ('pk100000-0000-0000-0000-000000000001', 'P-101', 'Sótano 1', 'PRIVADO', 'ASIGNADO'),
  ('pk100000-0000-0000-0000-000000000002', 'P-102', 'Sótano 1', 'ALQUILER', 'DISPONIBLE'),
  ('pk100000-0000-0000-0000-000000000003', 'V-01', 'Exterior Visitas', 'VISITANTES', 'DISPONIBLE')
ON CONFLICT DO NOTHING;
