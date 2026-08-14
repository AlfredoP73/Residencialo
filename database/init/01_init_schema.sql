-- =====================================================================
-- RESIDENCIALO — DATABASE SCHEMA v2  (PostgreSQL 16)
-- Normalizado hasta Tercera Forma Normal (3FN)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";  -- requerida para EXCLUDE con UUID

-- ─────────────────────────────────────────────────────────────────────
-- CATÁLOGOS DE DOMINIO
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cat_roles (
    id   SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    label VARCHAR(60) NOT NULL
);
INSERT INTO cat_roles (code, label) VALUES
    ('superadmin', 'Super Administrador'),
    ('admin',      'Administrador'),
    ('resident',   'Residente'),
    ('doorman',    'Portero')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS cat_permissions (
    id   SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS cat_role_permissions (
    role_id       INTEGER REFERENCES cat_roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES cat_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS cat_banks (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);
INSERT INTO cat_banks (code, name) VALUES
    ('1007', 'Bancolombia'),
    ('1023', 'Banco de Bogota'),
    ('1060', 'Banco de Occidente'),
    ('1013', 'BBVA Colombia'),
    ('1040', 'Banco Agrario'),
    ('1006', 'Banco Itau'),
    ('1009', 'Citibank Colombia'),
    ('1062', 'Banco Falabella'),
    ('1069', 'Banco Finandina'),
    ('1032', 'Banco de las Microfinanzas')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- DOMINIO 1 — AUTH & USERS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    document_type   VARCHAR(20)  NOT NULL DEFAULT 'CC',
    document_number VARCHAR(50)  UNIQUE NOT NULL,
    phone           VARCHAR(30),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_user_roles (
    user_id UUID    REFERENCES auth_users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES cat_roles(id)  ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    is_revoked  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_user ON auth_refresh_tokens(user_id);

-- ─────────────────────────────────────────────────────────────────────
-- DOMINIO 2 — RESIDENTIAL
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS res_towers (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(60)  NOT NULL,
    number       INTEGER      NOT NULL,
    total_floors INTEGER      NOT NULL DEFAULT 5,
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (number)
);

CREATE TABLE IF NOT EXISTS res_apartments (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tower_id         UUID      NOT NULL REFERENCES res_towers(id) ON DELETE CASCADE,
    apartment_number VARCHAR(20) NOT NULL,
    floor            INTEGER   NOT NULL,
    coefficient      NUMERIC(7,5) NOT NULL DEFAULT 0.02500,
    area_sqm         NUMERIC(8,2),
    status           VARCHAR(20)  NOT NULL DEFAULT 'HABITADO'
                     CHECK (status IN ('HABITADO','DESOCUPADO','EN_REFORMA')),
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tower_id, apartment_number)
);
CREATE INDEX IF NOT EXISTS idx_res_apartments_tower   ON res_apartments(tower_id);
CREATE INDEX IF NOT EXISTS idx_res_apartments_status  ON res_apartments(status);

CREATE TABLE IF NOT EXISTS res_resident_contacts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(200) NOT NULL,
    document_type   VARCHAR(20)  NOT NULL DEFAULT 'CC',
    document_number VARCHAR(50)  NOT NULL,
    email           VARCHAR(255),
    phone           VARCHAR(30),
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (document_type, document_number)
);

CREATE TABLE IF NOT EXISTS res_residents (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apartment_id         UUID      NOT NULL REFERENCES res_apartments(id) ON DELETE CASCADE,
    user_id              UUID      REFERENCES auth_users(id) ON DELETE SET NULL,
    contact_id           UUID      REFERENCES res_resident_contacts(id) ON DELETE SET NULL,
    resident_type        VARCHAR(30) NOT NULL DEFAULT 'PROPIETARIO'
                         CHECK (resident_type IN ('PROPIETARIO','ARRENDATARIO','FAMILIAR')),
    is_principal_contact BOOLEAN   NOT NULL DEFAULT TRUE,
    start_date           DATE      NOT NULL DEFAULT CURRENT_DATE,
    end_date             DATE,
    is_active            BOOLEAN   NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_resident_identity CHECK (
        (user_id IS NOT NULL) OR (contact_id IS NOT NULL)
    )
);
CREATE INDEX IF NOT EXISTS idx_res_residents_apartment ON res_residents(apartment_id);
CREATE INDEX IF NOT EXISTS idx_res_residents_user      ON res_residents(user_id);
CREATE INDEX IF NOT EXISTS idx_res_residents_active    ON res_residents(is_active);

CREATE TABLE IF NOT EXISTS res_vehicles (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apartment_id  UUID NOT NULL REFERENCES res_apartments(id) ON DELETE CASCADE,
    license_plate VARCHAR(10) NOT NULL,
    vehicle_type  VARCHAR(20) NOT NULL DEFAULT 'CARRO'
                  CHECK (vehicle_type IN ('CARRO','MOTO','BICICLETA')),
    brand         VARCHAR(50),
    model         VARCHAR(50),
    color         VARCHAR(30),
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (license_plate)
);
CREATE INDEX IF NOT EXISTS idx_res_vehicles_apartment ON res_vehicles(apartment_id);

-- ─────────────────────────────────────────────────────────────────────
-- DOMINIO 3 — PAYMENTS (estructura 3FN, sin desarrollar en MVP)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pay_fee_concepts (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(30) UNIQUE NOT NULL,
    description VARCHAR(100) NOT NULL,
    is_active   BOOLEAN DEFAULT TRUE
);
INSERT INTO pay_fee_concepts (code, description) VALUES
    ('ADMIN',        'Cuota de administracion'),
    ('PARKING_RENT', 'Alquiler de parqueadero'),
    ('EXTRA',        'Cuota extraordinaria'),
    ('SANCTION',     'Sancion / multa')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS pay_obligations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apartment_id    UUID      NOT NULL REFERENCES res_apartments(id) ON DELETE CASCADE,
    concept_id      INTEGER   NOT NULL REFERENCES pay_fee_concepts(id),
    period          CHAR(7)   NOT NULL,
    base_amount     NUMERIC(12,2) NOT NULL,
    penalty_amount  NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    due_date        DATE      NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                    CHECK (status IN ('PENDIENTE','PAGADO','VENCIDO','ANULADO')),
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (apartment_id, concept_id, period)
);
CREATE INDEX IF NOT EXISTS idx_pay_obligations_apartment ON pay_obligations(apartment_id);
CREATE INDEX IF NOT EXISTS idx_pay_obligations_status    ON pay_obligations(status);
CREATE INDEX IF NOT EXISTS idx_pay_obligations_period    ON pay_obligations(period);

CREATE TABLE IF NOT EXISTS pay_transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    obligation_id       UUID REFERENCES pay_obligations(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    internal_reference  VARCHAR(100) UNIQUE NOT NULL,
    provider_reference  VARCHAR(100),
    payment_provider    VARCHAR(30) NOT NULL DEFAULT 'WOMPI',
    payment_method      VARCHAR(30) DEFAULT 'PSE',
    bank_code           VARCHAR(20) REFERENCES cat_banks(code) ON DELETE SET NULL,
    amount              NUMERIC(12,2) NOT NULL,
    currency            CHAR(3) DEFAULT 'COP',
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING','APPROVED','DECLINED','ERROR')),
    provider_response   JSONB,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pay_transactions_obligation ON pay_transactions(obligation_id);
CREATE INDEX IF NOT EXISTS idx_pay_transactions_status     ON pay_transactions(status);

CREATE TABLE IF NOT EXISTS pay_receipts (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID UNIQUE NOT NULL REFERENCES pay_transactions(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    amount_paid    NUMERIC(12,2) NOT NULL,
    payment_date   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    pdf_url        VARCHAR(255)
);

-- ─────────────────────────────────────────────────────────────────────
-- DOMINIO 4 — COMMUNITY
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cat_area_types (
    id                  SERIAL PRIMARY KEY,
    code                VARCHAR(30) UNIQUE NOT NULL,
    label               VARCHAR(60) NOT NULL,
    default_capacity    INTEGER DEFAULT 20,
    default_hourly_rate NUMERIC(10,2) DEFAULT 0.00,
    requires_approval   BOOLEAN DEFAULT TRUE
);
INSERT INTO cat_area_types (code, label, default_capacity, default_hourly_rate, requires_approval) VALUES
    ('SALON',   'Salon Comunal',   80, 50000.00, TRUE),
    ('BBQ',     'Zona BBQ',        20, 30000.00, FALSE),
    ('GYM',     'Gimnasio',        15,     0.00, FALSE),
    ('PISCINA', 'Piscina',         30,     0.00, FALSE),
    ('OTRO',    'Zona Comunal',    20,     0.00, TRUE)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS com_common_areas (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_type_id      INTEGER NOT NULL REFERENCES cat_area_types(id),
    name              VARCHAR(100) NOT NULL,
    capacity          INTEGER NOT NULL DEFAULT 20,
    hourly_rate       NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    rules_text        TEXT,
    requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_com_areas_type   ON com_common_areas(area_type_id);
CREATE INDEX IF NOT EXISTS idx_com_areas_active ON com_common_areas(is_active);

-- Reservas: EXCLUDE simplificado sin UUID en GIST (solo tsrange)
-- La unicidad de area+fecha+horario se valida en el servicio
CREATE TABLE IF NOT EXISTS com_reservations (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    common_area_id   UUID NOT NULL REFERENCES com_common_areas(id) ON DELETE CASCADE,
    apartment_id     UUID NOT NULL REFERENCES res_apartments(id) ON DELETE CASCADE,
    user_id          UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    reservation_date DATE NOT NULL,
    start_time       TIME NOT NULL,
    end_time         TIME NOT NULL,
    total_fee        NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status           VARCHAR(20) NOT NULL DEFAULT 'SOLICITADA'
                     CHECK (status IN ('SOLICITADA','APROBADA','RECHAZADA','CANCELADA')),
    notes            TEXT,
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_com_reservations_area ON com_reservations(common_area_id);
CREATE INDEX IF NOT EXISTS idx_com_reservations_apt  ON com_reservations(apartment_id);
CREATE INDEX IF NOT EXISTS idx_com_reservations_date ON com_reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_com_reservations_stat ON com_reservations(status);
-- Índice único para evitar doble reserva del mismo espacio en mismo horario activo
CREATE UNIQUE INDEX IF NOT EXISTS idx_com_reservations_no_overlap
    ON com_reservations (common_area_id, reservation_date, start_time, end_time)
    WHERE status NOT IN ('RECHAZADA', 'CANCELADA');

CREATE TABLE IF NOT EXISTS com_parking_spaces (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_number  VARCHAR(20) UNIQUE NOT NULL,
    location_zone VARCHAR(50) NOT NULL DEFAULT 'Sotano 1',
    parking_type  VARCHAR(20) NOT NULL DEFAULT 'PRIVADO'
                  CHECK (parking_type IN ('PRIVADO','ALQUILER','VISITANTES')),
    status        VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE'
                  CHECK (status IN ('DISPONIBLE','ASIGNADO','OCUPADO','MANTENIMIENTO')),
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_com_parking_type   ON com_parking_spaces(parking_type);
CREATE INDEX IF NOT EXISTS idx_com_parking_status ON com_parking_spaces(status);

CREATE TABLE IF NOT EXISTS com_parking_assignments (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parking_space_id UUID NOT NULL REFERENCES com_parking_spaces(id) ON DELETE CASCADE,
    apartment_id     UUID NOT NULL REFERENCES res_apartments(id) ON DELETE CASCADE,
    vehicle_id       UUID REFERENCES res_vehicles(id) ON DELETE SET NULL,
    assigned_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unassigned_at    TIMESTAMPTZ,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_com_parking_assign_space ON com_parking_assignments(parking_space_id);
CREATE INDEX IF NOT EXISTS idx_com_parking_assign_apt   ON com_parking_assignments(apartment_id);
-- Un espacio solo puede tener una asignación activa
CREATE UNIQUE INDEX IF NOT EXISTS idx_com_parking_one_active
    ON com_parking_assignments (parking_space_id)
    WHERE is_active = TRUE;

-- ─────────────────────────────────────────────────────────────────────
-- DOMINIO 5 — OPERATIONS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ops_contractor_companies (
    id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name  VARCHAR(150) UNIQUE NOT NULL,
    nit   VARCHAR(30),
    phone VARCHAR(30),
    email VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS ops_staff (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id               UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    contractor_company_id UUID REFERENCES ops_contractor_companies(id) ON DELETE SET NULL,
    full_name             VARCHAR(200) NOT NULL,
    document_number       VARCHAR(50)  UNIQUE NOT NULL,
    role_title            VARCHAR(50)  NOT NULL DEFAULT 'PORTERO'
                          CHECK (role_title IN ('PORTERO','VIGILANTE','SUPERVISOR')),
    phone                 VARCHAR(30),
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ops_staff_active ON ops_staff(is_active);

CREATE TABLE IF NOT EXISTS ops_shifts (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(50) UNIQUE NOT NULL,
    start_time TIME NOT NULL,
    end_time   TIME NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_shift_assignments (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id   UUID NOT NULL REFERENCES ops_staff(id) ON DELETE CASCADE,
    shift_id   UUID NOT NULL REFERENCES ops_shifts(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    UNIQUE (staff_id, shift_date)
);
CREATE INDEX IF NOT EXISTS idx_ops_shift_assign_date ON ops_shift_assignments(shift_date);

CREATE TABLE IF NOT EXISTS ops_packages (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apartment_id          UUID NOT NULL REFERENCES res_apartments(id) ON DELETE CASCADE,
    courier_company       VARCHAR(100) NOT NULL,
    tracking_number       VARCHAR(100),
    recipient_name        VARCHAR(150) NOT NULL,
    received_by_staff_id  UUID REFERENCES ops_staff(id) ON DELETE SET NULL,
    received_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_to_user_id  UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    delivered_by_staff_id UUID REFERENCES ops_staff(id) ON DELETE SET NULL,
    delivered_at          TIMESTAMPTZ,
    status                VARCHAR(20) NOT NULL DEFAULT 'RECIBIDO'
                          CHECK (status IN ('RECIBIDO','ENTREGADO','DEVUELTO')),
    notes                 TEXT
);
CREATE INDEX IF NOT EXISTS idx_ops_packages_apartment ON ops_packages(apartment_id);
CREATE INDEX IF NOT EXISTS idx_ops_packages_status    ON ops_packages(status);

CREATE TABLE IF NOT EXISTS ops_visitors (
    id                           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apartment_id                 UUID NOT NULL REFERENCES res_apartments(id) ON DELETE CASCADE,
    pre_authorized_by_user_id    UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    full_name                    VARCHAR(150) NOT NULL,
    document_number              VARCHAR(50)  NOT NULL,
    vehicle_plate                VARCHAR(10),
    expected_date                DATE NOT NULL DEFAULT CURRENT_DATE,
    entry_registered_by_staff_id UUID REFERENCES ops_staff(id) ON DELETE SET NULL,
    entry_timestamp              TIMESTAMPTZ,
    exit_registered_by_staff_id  UUID REFERENCES ops_staff(id) ON DELETE SET NULL,
    exit_timestamp               TIMESTAMPTZ,
    status                       VARCHAR(20) NOT NULL DEFAULT 'AUTORIZADO'
                                 CHECK (status IN ('AUTORIZADO','EN_CONJUNTO','RETIRADO','RECHAZADO')),
    notes                        TEXT
);
CREATE INDEX IF NOT EXISTS idx_ops_visitors_apartment ON ops_visitors(apartment_id);
CREATE INDEX IF NOT EXISTS idx_ops_visitors_status    ON ops_visitors(status);
CREATE INDEX IF NOT EXISTS idx_ops_visitors_date      ON ops_visitors(expected_date);

-- ─────────────────────────────────────────────────────────────────────
-- DOMINIO 6 — MANAGEMENT
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cat_pqrs_types (
    id    SERIAL PRIMARY KEY,
    code  VARCHAR(30) UNIQUE NOT NULL,
    label VARCHAR(60) NOT NULL
);
INSERT INTO cat_pqrs_types (code, label) VALUES
    ('PETICION',   'Peticion'),
    ('QUEJA',      'Queja'),
    ('RECLAMO',    'Reclamo'),
    ('SUGERENCIA', 'Sugerencia')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS mgt_pqrs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number       VARCHAR(30) UNIQUE NOT NULL,
    apartment_id        UUID      NOT NULL REFERENCES res_apartments(id) ON DELETE CASCADE,
    user_id             UUID      REFERENCES auth_users(id) ON DELETE SET NULL,
    pqrs_type_id        INTEGER   NOT NULL REFERENCES cat_pqrs_types(id),
    subject             VARCHAR(200) NOT NULL,
    description         TEXT NOT NULL,
    priority            VARCHAR(20) NOT NULL DEFAULT 'MEDIA'
                        CHECK (priority IN ('BAJA','MEDIA','ALTA','URGENTE')),
    status              VARCHAR(20) NOT NULL DEFAULT 'CREADA'
                        CHECK (status IN ('CREADA','EN_REVISION','RESUELTA','CERRADA','RECHAZADA')),
    assigned_to_user_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mgt_pqrs_apartment ON mgt_pqrs(apartment_id);
CREATE INDEX IF NOT EXISTS idx_mgt_pqrs_status    ON mgt_pqrs(status);
CREATE INDEX IF NOT EXISTS idx_mgt_pqrs_priority  ON mgt_pqrs(priority);

CREATE TABLE IF NOT EXISTS mgt_pqrs_comments (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pqrs_id          UUID    NOT NULL REFERENCES mgt_pqrs(id) ON DELETE CASCADE,
    user_id          UUID    REFERENCES auth_users(id) ON DELETE SET NULL,
    comment_text     TEXT    NOT NULL,
    is_internal_note BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mgt_pqrs_comments_pqrs ON mgt_pqrs_comments(pqrs_id);

CREATE TABLE IF NOT EXISTS cat_document_categories (
    id    SERIAL PRIMARY KEY,
    code  VARCHAR(30) UNIQUE NOT NULL,
    label VARCHAR(60) NOT NULL
);
INSERT INTO cat_document_categories (code, label) VALUES
    ('REGLAMENTO', 'Reglamento'),
    ('MANUAL',     'Manual'),
    ('ACTA',       'Acta de asamblea'),
    ('CIRCULAR',   'Circular'),
    ('CONTRATO',   'Contrato'),
    ('GENERAL',    'General')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS mgt_documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id         INTEGER NOT NULL REFERENCES cat_document_categories(id),
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    file_url            VARCHAR(255) NOT NULL,
    visibility          VARCHAR(30)  NOT NULL DEFAULT 'RESIDENTS_ONLY'
                        CHECK (visibility IN ('PUBLIC','RESIDENTS_ONLY','ADMIN_ONLY')),
    uploaded_by_user_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mgt_documents_category   ON mgt_documents(category_id);
CREATE INDEX IF NOT EXISTS idx_mgt_documents_visibility ON mgt_documents(visibility);

CREATE TABLE IF NOT EXISTS mgt_audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    module      VARCHAR(50)  NOT NULL,
    resource_id VARCHAR(100),
    details     JSONB,
    ip_address  VARCHAR(45),
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mgt_audit_user      ON mgt_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mgt_audit_module    ON mgt_audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_mgt_audit_timestamp ON mgt_audit_logs(timestamp DESC);

-- ─────────────────────────────────────────────────────────────────────
-- DATOS SEMILLA
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO res_towers (id, name, number, total_floors) VALUES
    ('00000000-0000-0000-0001-000000000001', 'Torre 1', 1, 5),
    ('00000000-0000-0000-0001-000000000002', 'Torre 2', 2, 5)
ON CONFLICT DO NOTHING;

INSERT INTO res_apartments (id, tower_id, apartment_number, floor, coefficient, area_sqm, status) VALUES
    ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', '101', 1, 0.02500, 72.00, 'HABITADO'),
    ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000001', '201', 2, 0.02500, 68.00, 'DESOCUPADO'),
    ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000001', '302', 3, 0.02500, 72.00, 'HABITADO'),
    ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000002', '401', 4, 0.02500, 75.00, 'HABITADO')
ON CONFLICT DO NOTHING;

INSERT INTO com_common_areas (id, area_type_id, name, capacity, hourly_rate, rules_text, requires_approval, is_active) VALUES
    ('00000000-0000-0000-0004-000000000001', 1, 'Salon Comunal Principal', 80, 50000.00, 'No musica amplificada despues de las 22:00', TRUE,  TRUE),
    ('00000000-0000-0000-0004-000000000002', 2, 'Zona BBQ Terraza',        20, 30000.00, 'Dejar la zona limpia al finalizar',          FALSE, TRUE),
    ('00000000-0000-0000-0004-000000000003', 3, 'Gimnasio',                15,     0.00, 'Horario 05:00 - 22:00',                     FALSE, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO com_parking_spaces (id, space_number, location_zone, parking_type, status) VALUES
    ('00000000-0000-0000-0005-000000000001', 'P-101', 'Sotano 1', 'PRIVADO',    'ASIGNADO'),
    ('00000000-0000-0000-0005-000000000002', 'P-102', 'Sotano 1', 'ALQUILER',   'DISPONIBLE'),
    ('00000000-0000-0000-0005-000000000003', 'V-01',  'Exterior', 'VISITANTES', 'DISPONIBLE'),
    ('00000000-0000-0000-0005-000000000004', 'V-02',  'Exterior', 'VISITANTES', 'OCUPADO'),
    ('00000000-0000-0000-0005-000000000005', 'P-201', 'Sotano 1', 'PRIVADO',    'DISPONIBLE')
ON CONFLICT DO NOTHING;

INSERT INTO ops_contractor_companies (id, name, nit) VALUES
    ('00000000-0000-0000-0006-000000000001', 'Seguridad Total S.A.S', '900123456-1')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- USUARIOS DEMO (bcrypt nativo, sin passlib)
-- admin@residencialo.com / admin123
-- residente@residencialo.com / res123
-- portero@residencialo.com / door123
-- ana.lopez@gmail.com / res123
-- carlos.m@gmail.com / res123
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO auth_users (id, email, password_hash, first_name, last_name, document_type, document_number, is_active) VALUES
    ('00000000-0000-0000-0010-000000000001',
     'admin@residencialo.com',
     '$2b$10$lSHxdpsDOwcJ7YTZ5H.cDuSYy1SlwRkJkwUtGs72CNLWQpNT65Ci6',
     'Ana Maria', 'Administradora', 'CC', '1098000010', TRUE),
    ('00000000-0000-0000-0010-000000000002',
     'residente@residencialo.com',
     '$2b$10$f2q1KVTtsiENPygnOPD2/uzLr5kSPOAP1yTyuVNAEBC3qZOW1/vEi',
     'Juan Fernando', 'Perez', 'CC', '1098123456', TRUE),
    ('00000000-0000-0000-0010-000000000003',
     'portero@residencialo.com',
     '$2b$10$/fbVNDQ6IDM4/Vb8madOE.dVwjxWKp.c0QAuzlEYv39.dQbJ/mCcy',
     'Pedro Jose', 'Gomez', 'CC', '1098000003', TRUE),
    ('00000000-0000-0000-0010-000000000004',
     'ana.lopez@gmail.com',
     '$2b$10$f2q1KVTtsiENPygnOPD2/uzLr5kSPOAP1yTyuVNAEBC3qZOW1/vEi',
     'Ana Maria', 'Lopez', 'CC', '1098654321', TRUE),
    ('00000000-0000-0000-0010-000000000005',
     'carlos.m@gmail.com',
     '$2b$10$f2q1KVTtsiENPygnOPD2/uzLr5kSPOAP1yTyuVNAEBC3qZOW1/vEi',
     'Carlos Eduardo', 'Martinez', 'CC', '1098111222', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO auth_user_roles (user_id, role_id) VALUES
    ('00000000-0000-0000-0010-000000000001', (SELECT id FROM cat_roles WHERE code='admin')),
    ('00000000-0000-0000-0010-000000000002', (SELECT id FROM cat_roles WHERE code='resident')),
    ('00000000-0000-0000-0010-000000000003', (SELECT id FROM cat_roles WHERE code='doorman')),
    ('00000000-0000-0000-0010-000000000004', (SELECT id FROM cat_roles WHERE code='resident')),
    ('00000000-0000-0000-0010-000000000005', (SELECT id FROM cat_roles WHERE code='resident'))
ON CONFLICT DO NOTHING;

INSERT INTO res_resident_contacts (id, full_name, document_type, document_number, email, phone) VALUES
    ('00000000-0000-0000-0011-000000000001', 'Juan Fernando Perez',    'CC', '1098123456', 'residente@residencialo.com', '3001234567'),
    ('00000000-0000-0000-0011-000000000002', 'Ana Maria Lopez',        'CC', '1098654321', 'ana.lopez@gmail.com',        '3109876543'),
    ('00000000-0000-0000-0011-000000000003', 'Carlos Eduardo Martinez', 'CC', '1098111222', 'carlos.m@gmail.com',         '3151112233')
ON CONFLICT DO NOTHING;

INSERT INTO res_residents (id, apartment_id, user_id, contact_id, resident_type, is_principal_contact, is_active) VALUES
    ('00000000-0000-0000-0012-000000000001',
     '00000000-0000-0000-0002-000000000003',
     '00000000-0000-0000-0010-000000000002',
     '00000000-0000-0000-0011-000000000001',
     'PROPIETARIO', TRUE, TRUE),
    ('00000000-0000-0000-0012-000000000002',
     '00000000-0000-0000-0002-000000000001',
     '00000000-0000-0000-0010-000000000004',
     '00000000-0000-0000-0011-000000000002',
     'ARRENDATARIO', TRUE, TRUE),
    ('00000000-0000-0000-0012-000000000003',
     '00000000-0000-0000-0002-000000000004',
     '00000000-0000-0000-0010-000000000005',
     '00000000-0000-0000-0011-000000000003',
     'PROPIETARIO', TRUE, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO ops_contractor_companies (id, name, nit) VALUES
    ('00000000-0000-0000-0006-000000000001', 'Seguridad Total S.A.S', '900123456-1')
ON CONFLICT DO NOTHING;

INSERT INTO ops_staff (id, user_id, contractor_company_id, full_name, document_number, role_title, phone, is_active) VALUES
    ('00000000-0000-0000-0013-000000000001',
     '00000000-0000-0000-0010-000000000003',
     '00000000-0000-0000-0006-000000000001',
     'Pedro Jose Gomez', '1098000003', 'PORTERO', '3200001111', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO ops_shifts (id, name, start_time, end_time) VALUES
    ('00000000-0000-0000-0014-000000000001', 'Diurno',   '06:00', '18:00'),
    ('00000000-0000-0000-0014-000000000002', 'Nocturno', '18:00', '06:00')
ON CONFLICT DO NOTHING;

INSERT INTO res_vehicles (id, apartment_id, license_plate, vehicle_type, brand, model, color) VALUES
    ('00000000-0000-0000-0015-000000000001',
     '00000000-0000-0000-0002-000000000003',
     'ABC-123', 'CARRO', 'Toyota', 'Corolla', 'Blanco'),
    ('00000000-0000-0000-0015-000000000002',
     '00000000-0000-0000-0002-000000000001',
     'XYZ-789', 'MOTO', 'Yamaha', 'FZ', 'Negro')
ON CONFLICT DO NOTHING;
