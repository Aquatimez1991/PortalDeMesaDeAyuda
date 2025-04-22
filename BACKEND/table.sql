-- 📌 Crear tipo ENUM para roles
CREATE TYPE user_role AS ENUM ('admin', 'user', 'agent', 'technician', 'manager', 'vendor');

-- 📌 Crear tipo ENUM para typeUser
CREATE TYPE user_type AS ENUM ('internal', 'external');

-- 📌 Crear tabla usersPortalMesa con nuevas columnas
CREATE TABLE usersPortalMesa (
                                 id SERIAL PRIMARY KEY,
                                 userName VARCHAR(50) UNIQUE NOT NULL, -- antes era name
                                 fullName VARCHAR(250) NOT NULL,
                                 lastName VARCHAR(250) NOT NULL,
                                 organizationBody VARCHAR(255),
                                 organizationUnit VARCHAR(255),
                                 organizationArea VARCHAR(255),
                                 organizationPosition VARCHAR(255),
                                 typeUser user_type,
                                 contactNumber VARCHAR(20),
                                 email VARCHAR(50) UNIQUE NOT NULL,
                                 passworduser VARCHAR(255) NOT NULL,
                                 statususers BOOLEAN NOT NULL DEFAULT true, --FALSE
                                 roleuser user_role NOT NULL,
                                 reset_token VARCHAR(255),
                                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                 last_login TIMESTAMP,
                                 is_verified BOOLEAN DEFAULT false,
                                 profile_picture VARCHAR(255),
                                 failed_login_attempts INT DEFAULT 0,

    -- ✅ Recomendación 2 - Validación del formato de email (Opción A)
                                 CONSTRAINT chk_email_format CHECK (
                                     email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
                                     )
);

-- ✅ Recomendación 1 - Crear índice adicional en userName
CREATE INDEX idx_usersPortalMesa_userName ON usersPortalMesa(userName);

-- 📌 Crear índice en email para mejorar búsqueda
CREATE INDEX idx_usersPortalMesa_email ON usersPortalMesa(email);

-- 📌 Insertar usuario administrador de ejemplo
INSERT INTO usersPortalMesa (
    userName, fullName, lastName, organizationBody, organizationUnit, organizationArea, organizationPosition, typeUser, contactNumber, email, passworduser, statususers, roleuser, is_verified
)
VALUES (
           'esalgado',               -- userName
           'Elias Jeshua',           -- fullName
           'Salgado Coripuna',       -- lastName
           'Oficina de Tecnologia e Informacion', -- organo
           'Unidad de Infraestructura y Soporte Tecnico', -- unidad
           'ninguno',                -- area
           'Soporte de mesa de ayuda', -- cargo
           'internal',               -- typeUser
           '949799869',              -- contactNumber
           'esalgadoc@outlook.com',  -- email
           'admin',                  -- password (debería estar encriptado)
           true,                     -- status
           'admin',                  -- role
           true                      -- is_verified
       );

-- 📌 Función que actualiza el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 📌 Trigger que actualiza updated_at automáticamente
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON usersPortalMesa
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
