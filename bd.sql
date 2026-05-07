-- ============================================================
-- PAI Vacunacion — Esquema simplificado
-- 7 tablas principales + funciones RLS
-- Ejecutar completo en el SQL Editor de Supabase
-- ============================================================

-- ============================================================
-- TABLAS GEOGRÁFICAS
-- ============================================================

CREATE TABLE departamento (
  codigo_departamento VARCHAR PRIMARY KEY,
  departamento_nombre VARCHAR NOT NULL,
  poblacion_estimada INT
);

CREATE TABLE municipio (
  municipio_id VARCHAR PRIMARY KEY,
  codigo_departamento VARCHAR NOT NULL REFERENCES departamento(codigo_departamento),
  nombre_municipio VARCHAR NOT NULL,
  zona_geografica VARCHAR,
  es_capital_departamental BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- ESTABLECIMIENTOS
-- ============================================================

CREATE TABLE establecimiento (
  establecimiento_id VARCHAR PRIMARY KEY,
  municipio_id VARCHAR NOT NULL REFERENCES municipio(municipio_id),
  nombre_establecimiento VARCHAR NOT NULL,
  tipo_establecimiento VARCHAR,
  nivel_atencion INT,
  zona VARCHAR,
  red_salud VARCHAR,
  latitud DECIMAL,
  longitud DECIMAL,
  tiene_cadena_frio BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- VACUNAS (incluye reglas de dosis — sin tabla separada)
-- ============================================================

CREATE TABLE vacuna (
  vacuna_id VARCHAR PRIMARY KEY,
  vacuna_nombre VARCHAR NOT NULL,
  enfermedad_previene VARCHAR,
  grupo_pai VARCHAR,
  numero_dosis INT NOT NULL DEFAULT 1,
  via_administracion VARCHAR,
  sitio_aplicacion VARCHAR,
  edad_minima_dias INT,
  edad_maxima_dias INT,
  intervalo_minimo_dias INT
);

-- ============================================================
-- PACIENTES
-- ============================================================

CREATE TABLE paciente (
  paciente_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_identidad VARCHAR,
  nombres VARCHAR NOT NULL,
  primer_apellido VARCHAR NOT NULL,
  segundo_apellido VARCHAR,
  genero VARCHAR CHECK (genero IN ('M','F')),
  fecha_nacimiento DATE NOT NULL,
  municipio_residencia VARCHAR REFERENCES municipio(municipio_id),
  es_pueblo_indigena BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- REGISTRO DE VACUNACIÓN (evento central)
-- ============================================================

CREATE TABLE registro_vacunacion (
  registro_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES paciente(paciente_id),
  vacuna_id VARCHAR NOT NULL REFERENCES vacuna(vacuna_id),
  establecimiento_id VARCHAR NOT NULL REFERENCES establecimiento(establecimiento_id),
  fecha_vacunacion TIMESTAMP NOT NULL,
  numero_dosis INT NOT NULL,
  lote_vacuna VARCHAR,
  temperatura_conservacion DECIMAL,
  edad_dias_aplicacion INT,
  via_administracion VARCHAR,
  observaciones TEXT,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PERFIL DE USUARIO (auth + rol + alcance en una sola tabla)
-- ============================================================

CREATE TABLE usuario_perfil (
  id_usuario UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  nombre VARCHAR NOT NULL,
  rol VARCHAR NOT NULL CHECK (
    rol IN ('ADMIN_NAL', 'ADMIN_DEP', 'ADMIN_MUN', 'VACUNADOR', 'CONSULTA')
  ),
  -- Alcance territorial (solo uno aplica según el rol)
  codigo_departamento VARCHAR REFERENCES departamento(codigo_departamento),
  municipio_id VARCHAR REFERENCES municipio(municipio_id),
  establecimiento_id VARCHAR REFERENCES establecimiento(establecimiento_id),
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_paciente_doc ON paciente(documento_identidad);
CREATE INDEX idx_registro_paciente ON registro_vacunacion(paciente_id);
CREATE INDEX idx_registro_establecimiento ON registro_vacunacion(establecimiento_id);
CREATE INDEX idx_registro_fecha ON registro_vacunacion(fecha_vacunacion);

-- ============================================================
-- FUNCIONES RLS (leen el rol/alcance del usuario actual)
-- ============================================================

CREATE OR REPLACE FUNCTION obtener_rol()
RETURNS TEXT AS $$
  SELECT rol FROM usuario_perfil WHERE id_usuario = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION obtener_departamento()
RETURNS TEXT AS $$
  SELECT codigo_departamento FROM usuario_perfil WHERE id_usuario = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION obtener_municipio()
RETURNS TEXT AS $$
  SELECT municipio_id FROM usuario_perfil WHERE id_usuario = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION obtener_establecimiento()
RETURNS TEXT AS $$
  SELECT establecimiento_id FROM usuario_perfil WHERE id_usuario = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Paciente: cualquier usuario autenticado puede ver y registrar
ALTER TABLE paciente ENABLE ROW LEVEL SECURITY;

CREATE POLICY paciente_select ON paciente
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY paciente_insert ON paciente
FOR INSERT WITH CHECK (
  obtener_rol() IN ('ADMIN_NAL','ADMIN_DEP','ADMIN_MUN','VACUNADOR')
);

CREATE POLICY paciente_update ON paciente
FOR UPDATE USING (
  obtener_rol() IN ('ADMIN_NAL','ADMIN_DEP','ADMIN_MUN','VACUNADOR')
);

-- Registro vacunación: lectura según alcance; escritura para quienes tienen establecimiento
ALTER TABLE registro_vacunacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY registro_select ON registro_vacunacion
FOR SELECT USING (
  obtener_rol() IN ('ADMIN_NAL','CONSULTA')
  OR establecimiento_id = obtener_establecimiento()
  OR EXISTS (
    SELECT 1 FROM establecimiento e
    JOIN municipio m ON m.municipio_id = e.municipio_id
    WHERE e.establecimiento_id = registro_vacunacion.establecimiento_id
    AND (
      m.municipio_id = obtener_municipio()
      OR m.codigo_departamento = obtener_departamento()
    )
  )
);

CREATE POLICY registro_insert ON registro_vacunacion
FOR INSERT WITH CHECK (
  obtener_rol() IN ('ADMIN_NAL','ADMIN_DEP','ADMIN_MUN','VACUNADOR')
);

-- Establecimiento: todos ven; solo admins nacionales/departamentales gestionan
ALTER TABLE establecimiento ENABLE ROW LEVEL SECURITY;

CREATE POLICY establecimiento_select ON establecimiento
FOR SELECT USING (true);

CREATE POLICY establecimiento_write ON establecimiento
FOR ALL USING (
  obtener_rol() IN ('ADMIN_NAL','ADMIN_DEP')
) WITH CHECK (
  obtener_rol() IN ('ADMIN_NAL','ADMIN_DEP')
);

-- usuario_perfil: cada uno ve su propio perfil; admins ven todos
ALTER TABLE usuario_perfil ENABLE ROW LEVEL SECURITY;

CREATE POLICY perfil_self ON usuario_perfil
FOR SELECT USING (id_usuario = auth.uid());

CREATE POLICY perfil_admin_select ON usuario_perfil
FOR SELECT USING (obtener_rol() IN ('ADMIN_NAL','ADMIN_DEP','ADMIN_MUN'));

CREATE POLICY perfil_admin_write ON usuario_perfil
FOR ALL USING (
  obtener_rol() IN ('ADMIN_NAL','ADMIN_DEP','ADMIN_MUN')
) WITH CHECK (
  obtener_rol() IN ('ADMIN_NAL','ADMIN_DEP','ADMIN_MUN')
);

-- ============================================================
-- DATOS SEMILLA
-- ============================================================

INSERT INTO departamento (codigo_departamento, departamento_nombre) VALUES
('LPZ', 'La Paz'),
('SCZ', 'Santa Cruz'),
('CBB', 'Cochabamba'),
('ORU', 'Oruro'),
('POT', 'Potosí'),
('CHU', 'Chuquisaca'),
('TAR', 'Tarija'),
('BEN', 'Beni'),
('PAN', 'Pando');

INSERT INTO municipio (municipio_id, codigo_departamento, nombre_municipio, es_capital_departamental) VALUES
('MUN-LPZ-001', 'LPZ', 'La Paz',       TRUE),
('MUN-SCZ-001', 'SCZ', 'Santa Cruz',   TRUE),
('MUN-CBB-001', 'CBB', 'Cochabamba',   TRUE),
('MUN-ORU-001', 'ORU', 'Oruro',        TRUE),
('MUN-POT-001', 'POT', 'Potosí',       TRUE),
('MUN-CHU-001', 'CHU', 'Sucre',        TRUE),
('MUN-TAR-001', 'TAR', 'Tarija',       TRUE),
('MUN-BEN-001', 'BEN', 'Trinidad',     TRUE),
('MUN-PAN-001', 'PAN', 'Cobija',       TRUE);

INSERT INTO establecimiento (establecimiento_id, municipio_id, nombre_establecimiento, tipo_establecimiento, nivel_atencion, red_salud, activo) VALUES
('EST-LPZ-001', 'MUN-LPZ-001', 'Hospital La Paz',     'Hospital', 3, 'Red Norte',   TRUE),
('EST-SCZ-001', 'MUN-SCZ-001', 'Hospital Santa Cruz', 'Hospital', 3, 'Red Central', TRUE),
('EST-CBB-001', 'MUN-CBB-001', 'Hospital Cochabamba', 'Hospital', 3, 'Red Cercado', TRUE);

INSERT INTO vacuna (vacuna_id, vacuna_nombre, enfermedad_previene, grupo_pai, numero_dosis, via_administracion) VALUES
('VAC-BCG',     'BCG',          'Tuberculosis',           'Neonatal', 1, 'Intradérmica'),
('VAC-PENTA',   'Pentavalente', 'DPT + Hepatitis B + Hib','Menor 1',  3, 'Intramuscular'),
('VAC-SRP',     'SRP',          'Sarampión, Rubéola, Parotiditis', 'Menor 1', 2, 'Subcutánea'),
('VAC-INFLUE',  'Influenza',    'Influenza',              'Anual',    1, 'Intramuscular'),
('VAC-POLIO',   'Antipolio',    'Poliomielitis',          'Menor 1',  3, 'Oral');

-- Paciente de ejemplo
INSERT INTO paciente (documento_identidad, nombres, primer_apellido, segundo_apellido, genero, fecha_nacimiento) VALUES
('12345678', 'Juan', 'Perez', 'Lopez', 'M', '2020-01-01');

-- ============================================================
-- PASO MANUAL REQUERIDO — USUARIO ADMIN:
-- 1. En Supabase: Authentication > Users > "Add user"
--    Email: admin@pai.gob.bo  |  Password: (define una segura)
-- 2. Copia el UUID generado
-- 3. Ejecuta estos INSERTs reemplazando el UUID:
--HECHO!
-- ============================================================

INSERT INTO usuario_perfil (id_usuario, email, nombre, rol)
VALUES ('7d631cd3-409b-4b87-af19-9fa2284e560b', 'admin@pai.gob.bo', 'Administrador Nacional', 'ADMIN_NAL');






-- ============================================================
-- FIX COMPLETO: RLS SEGURO PARA PAI VACUNACIÓN
-- ============================================================
-- Ejecutar COMPLETO en el SQL Editor de Supabase
-- Reemplaza las políticas inseguras existentes
-- ============================================================

-- ============================================================
-- PASO 1: ELIMINAR POLÍTICAS INSEGURAS EXISTENTES
-- ============================================================

DROP POLICY IF EXISTS perfil_self ON usuario_perfil;
DROP POLICY IF EXISTS perfil_admin_select ON usuario_perfil;
DROP POLICY IF EXISTS perfil_admin_write ON usuario_perfil;
DROP POLICY IF EXISTS paciente_select ON paciente;
DROP POLICY IF EXISTS paciente_insert ON paciente;
DROP POLICY IF EXISTS paciente_update ON paciente;
DROP POLICY IF EXISTS registro_select ON registro_vacunacion;
DROP POLICY IF EXISTS registro_insert ON registro_vacunacion;


-- ============================================================
-- PASO 2: NUEVAS FUNCIONES HELPER
-- ============================================================

-- Obtener el nivel jerárquico del rol (para validar permisos)
CREATE OR REPLACE FUNCTION obtener_nivel_rol(rol_input VARCHAR)
RETURNS INT AS $$
BEGIN
  RETURN CASE 
    WHEN rol_input = 'ADMIN_NAL' THEN 4
    WHEN rol_input = 'ADMIN_DEP' THEN 3
    WHEN rol_input = 'ADMIN_MUN' THEN 2
    WHEN rol_input = 'VACUNADOR' THEN 1
    WHEN rol_input = 'CONSULTA' THEN 0
    ELSE -1
  END;
END;
$$ LANGUAGE PLPGSQL STABLE SECURITY DEFINER;

-- Validar que el usuario no está intentando crear/editar a alguien con rol superior
CREATE OR REPLACE FUNCTION puede_gestionar_usuario(
  rol_usuario_actual VARCHAR,
  departamento_usuario_actual VARCHAR,
  municipio_usuario_actual VARCHAR,
  rol_usuario_objetivo VARCHAR,
  departamento_usuario_objetivo VARCHAR,
  municipio_usuario_objetivo VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Solo ADMIN_NAL puede crear/editar otros ADMIN_NAL
  IF rol_usuario_objetivo = 'ADMIN_NAL' THEN
    RETURN rol_usuario_actual = 'ADMIN_NAL';
  END IF;

  -- ADMIN_NAL puede gestionar cualquier cosa
  IF rol_usuario_actual = 'ADMIN_NAL' THEN
    RETURN TRUE;
  END IF;

  -- ADMIN_DEP solo puede gestionar en su departamento
  -- (ADMIN_MUN, VACUNADOR, CONSULTA del mismo departamento)
  IF rol_usuario_actual = 'ADMIN_DEP' THEN
    RETURN (
      obtener_nivel_rol(rol_usuario_objetivo) < obtener_nivel_rol(rol_usuario_actual)
      AND departamento_usuario_objetivo = departamento_usuario_actual
    );
  END IF;

  -- ADMIN_MUN solo puede gestionar VACUNADOR y CONSULTA de su municipio
  IF rol_usuario_actual = 'ADMIN_MUN' THEN
    RETURN (
      obtener_nivel_rol(rol_usuario_objetivo) < obtener_nivel_rol(rol_usuario_actual)
      AND municipio_usuario_objetivo = municipio_usuario_actual
    );
  END IF;

  -- VACUNADOR y CONSULTA no pueden gestionar a nadie
  RETURN FALSE;
END;
$$ LANGUAGE PLPGSQL STABLE SECURITY DEFINER;


-- ============================================================
-- PASO 3: POLÍTICAS RLS PARA usuario_perfil (SEGURAS)
-- ============================================================

-- Cada usuario ve su propio perfil
CREATE POLICY perfil_ver_propio ON usuario_perfil
FOR SELECT USING (id_usuario = auth.uid());

-- ADMIN_NAL ve todos EXCEPTO otros ADMIN_NAL (solo ve sus propios datos)
CREATE POLICY perfil_admin_nal_ver_todos ON usuario_perfil
FOR SELECT USING (
  (id_usuario = auth.uid())
  OR (
    obtener_rol() = 'ADMIN_NAL'
    AND rol IN ('ADMIN_DEP', 'ADMIN_MUN', 'VACUNADOR', 'CONSULTA')
  )
);

-- ADMIN_DEP ve solo usuarios de su departamento (incluyendo su propio perfil)
-- EXCLUYE: ADMIN_NAL y ADMIN_DEP de otros departamentos
CREATE POLICY perfil_admin_dep_ver_departamento ON usuario_perfil
FOR SELECT USING (
  (id_usuario = auth.uid())
  OR (
    obtener_rol() = 'ADMIN_DEP'
    AND codigo_departamento = obtener_departamento()
    AND rol IN ('ADMIN_MUN', 'VACUNADOR', 'CONSULTA')
  )
);

-- ADMIN_MUN ve solo usuarios de su municipio (incluyendo su propio perfil)
-- EXCLUYE: ADMIN_NAL, ADMIN_DEP y ADMIN_MUN de otros municipios
CREATE POLICY perfil_admin_mun_ver_municipio ON usuario_perfil
FOR SELECT USING (
  (id_usuario = auth.uid())
  OR (
    obtener_rol() = 'ADMIN_MUN'
    AND municipio_id = obtener_municipio()
    AND rol IN ('VACUNADOR', 'CONSULTA')
  )
);

-- INSERTAR nuevos usuarios: solo ADMIN_NAL, ADMIN_DEP, ADMIN_MUN pueden
-- pero respetando la jerarquía territorial
CREATE POLICY perfil_insert ON usuario_perfil
FOR INSERT WITH CHECK (
  obtener_rol() IN ('ADMIN_NAL', 'ADMIN_DEP', 'ADMIN_MUN')
  AND puede_gestionar_usuario(
    obtener_rol(),
    obtener_departamento(),
    obtener_municipio(),
    rol,
    codigo_departamento,
    municipio_id
  )
);

-- ACTUALIZAR usuarios: solo si puede gestionar según jerarquía
CREATE POLICY perfil_update ON usuario_perfil
FOR UPDATE USING (
  (id_usuario = auth.uid()) -- Puedo actualizar mi propio perfil
  OR (
    obtener_rol() IN ('ADMIN_NAL', 'ADMIN_DEP', 'ADMIN_MUN')
    AND puede_gestionar_usuario(
      obtener_rol(),
      obtener_departamento(),
      obtener_municipio(),
      rol,
      codigo_departamento,
      municipio_id
    )
  )
) WITH CHECK (
  (id_usuario = auth.uid()) -- No puedo cambiar el rol de mi propio usuario
  OR (
    obtener_rol() IN ('ADMIN_NAL', 'ADMIN_DEP', 'ADMIN_MUN')
    AND puede_gestionar_usuario(
      obtener_rol(),
      obtener_departamento(),
      obtener_municipio(),
      rol,
      codigo_departamento,
      municipio_id
    )
  )
);


-- ============================================================
-- PASO 4: POLÍTICAS RLS PARA paciente (SEGURAS POR TERRITORIO)
-- ============================================================

-- ADMIN_NAL ve todos los pacientes
CREATE POLICY paciente_admin_nal_ver_todos ON paciente
FOR SELECT USING (obtener_rol() = 'ADMIN_NAL');

-- ADMIN_DEP ve solo pacientes de su departamento
CREATE POLICY paciente_admin_dep_ver_departamento ON paciente
FOR SELECT USING (
  obtener_rol() = 'ADMIN_DEP'
  AND municipio_residencia IN (
    SELECT municipio_id FROM municipio 
    WHERE codigo_departamento = obtener_departamento()
  )
);

-- ADMIN_MUN ve solo pacientes de su municipio
CREATE POLICY paciente_admin_mun_ver_municipio ON paciente
FOR SELECT USING (
  obtener_rol() = 'ADMIN_MUN'
  AND municipio_residencia = obtener_municipio()
);

-- VACUNADOR ve pacientes de su municipio (por municipio_residencia del paciente o por registros en su establecimiento)
CREATE POLICY paciente_vacunador_ver_municipio ON paciente
FOR SELECT USING (
  obtener_rol() = 'VACUNADOR'
  AND (
    municipio_residencia IN (
      SELECT municipio_id FROM establecimiento
      WHERE establecimiento_id = obtener_establecimiento()
    )
    OR paciente_id IN (
      SELECT paciente_id FROM registro_vacunacion
      WHERE establecimiento_id = obtener_establecimiento()
    )
  )
);

-- CONSULTA ve solo pacientes a través de registros de su establecimiento
CREATE POLICY paciente_consulta_ver_establecimiento ON paciente
FOR SELECT USING (
  obtener_rol() = 'CONSULTA'
  AND paciente_id IN (
    SELECT paciente_id FROM registro_vacunacion
    WHERE establecimiento_id = obtener_establecimiento()
  )
);

-- INSERTAR paciente: cualquier rol operativo puede insertar
-- El scope se controla a nivel SELECT y en la aplicación (formulario filtra municipios por rol)
CREATE POLICY paciente_insert ON paciente
FOR INSERT WITH CHECK (
  obtener_rol() IN ('ADMIN_NAL', 'ADMIN_DEP', 'ADMIN_MUN', 'VACUNADOR')
);

-- ACTUALIZAR paciente: mismo criterio que INSERT
CREATE POLICY paciente_update ON paciente
FOR UPDATE USING (
  obtener_rol() IN ('ADMIN_NAL', 'ADMIN_DEP', 'ADMIN_MUN', 'VACUNADOR')
  AND (
    obtener_rol() = 'ADMIN_NAL'
    OR (
      obtener_rol() = 'ADMIN_DEP'
      AND municipio_residencia IN (
        SELECT municipio_id FROM municipio 
        WHERE codigo_departamento = obtener_departamento()
      )
    )
    OR (
      obtener_rol() = 'ADMIN_MUN'
      AND municipio_residencia = obtener_municipio()
    )
    OR (
      obtener_rol() = 'VACUNADOR'
      AND municipio_residencia IN (
        SELECT municipio_id FROM municipio WHERE municipio_id IN (
          SELECT municipio_id FROM establecimiento 
          WHERE establecimiento_id = obtener_establecimiento()
        )
      )
    )
  )
);


-- ============================================================
-- PASO 5: POLÍTICAS RLS PARA registro_vacunacion (SEGURAS)
-- ============================================================

-- ADMIN_NAL ve todos los registros
CREATE POLICY registro_admin_nal_ver_todos ON registro_vacunacion
FOR SELECT USING (obtener_rol() = 'ADMIN_NAL');

-- ADMIN_DEP ve registros de establecimientos de su departamento
CREATE POLICY registro_admin_dep_ver_departamento ON registro_vacunacion
FOR SELECT USING (
  obtener_rol() = 'ADMIN_DEP'
  AND establecimiento_id IN (
    SELECT e.establecimiento_id FROM establecimiento e
    JOIN municipio m ON m.municipio_id = e.municipio_id
    WHERE m.codigo_departamento = obtener_departamento()
  )
);

-- ADMIN_MUN ve registros de establecimientos de su municipio
CREATE POLICY registro_admin_mun_ver_municipio ON registro_vacunacion
FOR SELECT USING (
  obtener_rol() = 'ADMIN_MUN'
  AND establecimiento_id IN (
    SELECT establecimiento_id FROM establecimiento
    WHERE municipio_id = obtener_municipio()
  )
);

-- VACUNADOR ve solo registros de su establecimiento
CREATE POLICY registro_vacunador_ver_propio ON registro_vacunacion
FOR SELECT USING (
  obtener_rol() = 'VACUNADOR'
  AND establecimiento_id = obtener_establecimiento()
);

-- CONSULTA ve solo registros de su establecimiento
CREATE POLICY registro_consulta_ver_propio ON registro_vacunacion
FOR SELECT USING (
  obtener_rol() = 'CONSULTA'
  AND establecimiento_id = obtener_establecimiento()
);

-- INSERTAR registro: ADMIN_DEP, ADMIN_MUN, VACUNADOR (en sus establecimientos)
CREATE POLICY registro_insert ON registro_vacunacion
FOR INSERT WITH CHECK (
  obtener_rol() IN ('ADMIN_NAL', 'ADMIN_DEP', 'ADMIN_MUN', 'VACUNADOR')
  AND (
    obtener_rol() = 'ADMIN_NAL'
    OR (
      obtener_rol() = 'ADMIN_DEP'
      AND establecimiento_id IN (
        SELECT e.establecimiento_id FROM establecimiento e
        JOIN municipio m ON m.municipio_id = e.municipio_id
        WHERE m.codigo_departamento = obtener_departamento()
      )
    )
    OR (
      obtener_rol() = 'ADMIN_MUN'
      AND establecimiento_id IN (
        SELECT establecimiento_id FROM establecimiento
        WHERE municipio_id = obtener_municipio()
      )
    )
    OR (
      obtener_rol() = 'VACUNADOR'
      AND establecimiento_id = obtener_establecimiento()
    )
  )
);

-- ACTUALIZAR registro: mismo criterio que INSERT
CREATE POLICY registro_update ON registro_vacunacion
FOR UPDATE USING (
  obtener_rol() IN ('ADMIN_NAL', 'ADMIN_DEP', 'ADMIN_MUN', 'VACUNADOR')
  AND (
    obtener_rol() = 'ADMIN_NAL'
    OR (
      obtener_rol() = 'ADMIN_DEP'
      AND establecimiento_id IN (
        SELECT e.establecimiento_id FROM establecimiento e
        JOIN municipio m ON m.municipio_id = e.municipio_id
        WHERE m.codigo_departamento = obtener_departamento()
      )
    )
    OR (
      obtener_rol() = 'ADMIN_MUN'
      AND establecimiento_id IN (
        SELECT establecimiento_id FROM establecimiento
        WHERE municipio_id = obtener_municipio()
      )
    )
    OR (
      obtener_rol() = 'VACUNADOR'
      AND establecimiento_id = obtener_establecimiento()
    )
  )
);


-- ============================================================
-- PASO 6: POLÍTICAS RLS PARA establecimiento (MEJORADO)
-- ============================================================

DROP POLICY IF EXISTS establecimiento_select ON establecimiento;
DROP POLICY IF EXISTS establecimiento_write ON establecimiento;
DROP POLICY IF EXISTS establecimiento_admin_nal_ver_todos ON establecimiento;
DROP POLICY IF EXISTS establecimiento_admin_mun_ver_municipio ON establecimiento;
DROP POLICY IF EXISTS establecimiento_vacunador_ver_propio ON establecimiento;
DROP POLICY IF EXISTS establecimiento_admin_nal_write ON establecimiento;
DROP POLICY IF EXISTS establecimiento_admin_dep_write ON establecimiento;

-- ADMIN_NAL ve todos, ADMIN_DEP solo de su departamento
CREATE POLICY establecimiento_admin_nal_ver_todos ON establecimiento
FOR SELECT USING (obtener_rol() = 'ADMIN_NAL');

CREATE POLICY establecimiento_admin_dep_ver_departamento ON establecimiento
FOR SELECT USING (
  obtener_rol() = 'ADMIN_DEP'
  AND municipio_id IN (
    SELECT municipio_id FROM municipio
    WHERE codigo_departamento = obtener_departamento()
  )
);

-- ADMIN_MUN ve solo establecimientos de su municipio
CREATE POLICY establecimiento_admin_mun_ver_municipio ON establecimiento
FOR SELECT USING (
  obtener_rol() = 'ADMIN_MUN'
  AND municipio_id = obtener_municipio()
);

-- VACUNADOR y CONSULTA ven solo su establecimiento
CREATE POLICY establecimiento_vacunador_ver_propio ON establecimiento
FOR SELECT USING (
  obtener_rol() IN ('VACUNADOR', 'CONSULTA')
  AND establecimiento_id = obtener_establecimiento()
);

-- ADMIN_NAL puede escribir cualquier establecimiento
CREATE POLICY establecimiento_admin_nal_write ON establecimiento
FOR ALL USING (obtener_rol() = 'ADMIN_NAL') WITH CHECK (obtener_rol() = 'ADMIN_NAL');

-- ADMIN_DEP solo puede escribir en establecimientos de su departamento
CREATE POLICY establecimiento_admin_dep_write ON establecimiento
FOR ALL USING (
  obtener_rol() = 'ADMIN_DEP'
  AND municipio_id IN (
    SELECT municipio_id FROM municipio
    WHERE codigo_departamento = obtener_departamento()
  )
) WITH CHECK (
  obtener_rol() = 'ADMIN_DEP'
  AND municipio_id IN (
    SELECT municipio_id FROM municipio
    WHERE codigo_departamento = obtener_departamento()
  )
);


-- ============================================================
-- VERIFICACIÓN: Ejecutar queries de prueba
-- ============================================================

-- Descomentar después de ejecutar para VERIFICAR:

/*
-- Ver qué ve cada rol:

-- 1. Como ADMIN_NAL: debería ver TODOS los usuarios EXCEPTO otros ADMIN_NAL
SELECT id_usuario, email, nombre, rol, codigo_departamento FROM usuario_perfil 
WHERE rol != 'ADMIN_NAL';

-- 2. Como ADMIN_DEP (LPZ): debería ver solo usuarios de La Paz (excepto ADMIN_NAL)
SELECT id_usuario, email, nombre, rol, codigo_departamento FROM usuario_perfil 
WHERE codigo_departamento = 'LPZ' 
AND rol IN ('ADMIN_MUN', 'VACUNADOR', 'CONSULTA');

-- 3. Intento de ADMIN_DEP actualizar a otro ADMIN_NAL: DEBERÍA FALLAR
-- UPDATE usuario_perfil SET rol = 'ADMIN_NAL' WHERE id_usuario = '...' 
-- → Error de RLS policy

*/

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================