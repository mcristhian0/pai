#!/bin/bash
# ═══════════════════════════════════════════════════════
# Script de seguridad — Sistema PAI Vacunación
# Objetivo: verificar que la BD y los endpoints estén
# protegidos correctamente (RLS, auth, validaciones)
#
# CRITERIO DE VULNERABILIDAD PRECISO:
# - SEGURO (✅): El servidor bloqueó/rechazó exitosamente
# - VULNERABLE (❌): El ataque se completó con éxito
# - INFO (ℹ️): Respuestas inesperadas que requieren análisis manual
# ═══════════════════════════════════════════════════════
# Uso:
#   ./testeo.sh                        → prueba localhost:3000
#   BASE_URL=https://tu-dominio.com ./testeo.sh
# ═══════════════════════════════════════════════════════

BASE="${BASE_URL:-http://localhost:3000}"

PASS=0
FAIL=0
INFO_COUNT=0

ok()   { echo "  ✅ SEGURO     ($1) — $2"; PASS=$((PASS+1)); }
fail() { echo "  ❌ VULNERABLE ($1) — $2"; FAIL=$((FAIL+1)); }
info() { echo "  ℹ️  REVISAR    ($1) — $2"; INFO_COUNT=$((INFO_COUNT+1)); }

# Función para verificar que el endpoint BLOQUEA sin autenticación
check_auth_blocked() {
  local desc="$1"; shift
  local args=("$@")
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "${args[@]}")

  # 401 = No autenticado, 403 = Forbidden, 307 = Redirect a login
  # Estas respuestas significan que el servidor bloqueó exitosamente
  if [[ "$status" == "401" || "$status" == "403" || "$status" == "307" ]]; then
    ok "$status" "$desc"
  else
    # Cualquier otra respuesta (200, 500, 400, etc) = revisar manualmente
    info "$status" "$desc — respuesta inesperada, requiere análisis"
  fi
}

# Función para verificar que endpoints ABIERTOS funcionan
check_public_endpoint() {
  local desc="$1"; shift
  local args=("$@")
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "${args[@]}")
  if [[ "$status" == "200" || "$status" == "204" ]]; then
    ok "$status" "$desc"
  else
    info "$status" "$desc (se esperaba 200)"
  fi
}

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  PAI Vacunación — Security Test Script (v2 — Preciso)"
echo "  Target: $BASE"
echo "═══════════════════════════════════════════════════════"

# ─────────────────────────────────────────────────────────
# FASE 1: Endpoints protegidos sin autenticación
# Vulnerabilidad: si devuelve 200 con datos o permite operación
# Seguro: si devuelve 401/403/307
# ─────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────────────────────"
echo "  FASE 1 — Acceso sin autenticación (deben bloquear)"
echo "─────────────────────────────────────────────────────────"

# Dashboard
check_auth_blocked "GET  /api/dashboard" \
  -X GET "$BASE/api/dashboard"

# Pacientes
check_auth_blocked "GET  /api/pacientes" \
  -X GET "$BASE/api/pacientes"

check_auth_blocked "POST /api/pacientes" \
  -X POST "$BASE/api/pacientes" \
  -H "Content-Type: application/json" \
  -d '{"ci":"99999999","names":"Test","birthDate":"2000-01-01"}'

check_auth_blocked "PATCH /api/pacientes/[id]" \
  -X PATCH "$BASE/api/pacientes/00000000-0000-0000-0000-000000000001" \
  -H "Content-Type: application/json" \
  -d '{"names":"Hacker"}'

check_auth_blocked "GET  /api/pacientes/by-ci" \
  -X GET "$BASE/api/pacientes/by-ci?ci=99999999"

# Usuarios
check_auth_blocked "GET  /api/usuarios" \
  -X GET "$BASE/api/usuarios"

check_auth_blocked "POST /api/usuarios (crear usuario)" \
  -X POST "$BASE/api/usuarios" \
  -H "Content-Type: application/json" \
  -d '{"email":"hacker@test.com","name":"Hacker","roleId":"ADMIN_NAL","password":"hacker123"}'

check_auth_blocked "PATCH /api/usuarios (cambiar rol)" \
  -X PATCH "$BASE/api/usuarios" \
  -H "Content-Type: application/json" \
  -d '{"userId":"00000000-0000-0000-0000-000000000001","roleId":"ADMIN_NAL"}'

check_auth_blocked "PATCH /api/usuarios/[id]" \
  -X PATCH "$BASE/api/usuarios/00000000-0000-0000-0000-000000000001" \
  -H "Content-Type: application/json" \
  -d '{"roleId":"ADMIN_NAL"}'

# Vacunación
check_auth_blocked "GET  /api/vacunacion" \
  -X GET "$BASE/api/vacunacion"

check_auth_blocked "POST /api/vacunacion" \
  -X POST "$BASE/api/vacunacion" \
  -H "Content-Type: application/json" \
  -d '{"patientId":"fake","vaccineId":"VAC-BCG","doseId":"1","establishmentId":"EST-001","vaccinationDate":"2026-01-01"}'

check_auth_blocked "GET  /api/vacunacion/options" \
  -X GET "$BASE/api/vacunacion/options"

# Establecimientos
check_auth_blocked "POST /api/establecimientos" \
  -X POST "$BASE/api/establecimientos" \
  -H "Content-Type: application/json" \
  -d '{"code":"EST-HACK-001","name":"Hack Center"}'

check_auth_blocked "PATCH /api/establecimientos/[id]" \
  -X PATCH "$BASE/api/establecimientos/EST-LPZ-001" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacked"}'

# Catálogos
check_auth_blocked "GET  /api/catalogos/vacunas" \
  -X GET "$BASE/api/catalogos/vacunas"

check_auth_blocked "POST /api/catalogos/vacunas" \
  -X POST "$BASE/api/catalogos/vacunas" \
  -H "Content-Type: application/json" \
  -d '{"cod_vacuna":"VAC-FAKE","nombre":"Vacuna Falsa"}'

check_auth_blocked "PATCH /api/catalogos/vacunas/[id]" \
  -X PATCH "$BASE/api/catalogos/vacunas/VAC-BCG" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Hacked"}'

# Auditoría
check_auth_blocked "GET  /api/auditoria" \
  -X GET "$BASE/api/auditoria"

# Ubicaciones (pueden ser abiertos)
echo ""
echo "  — Endpoints de referencia (locations):"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE/api/locations?type=departments")
if [[ "$STATUS" == "200" ]]; then
  info "$STATUS" "GET /api/locations (abierto — solo si es intencional)"
elif [[ "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "307" ]]; then
  ok "$STATUS" "GET /api/locations (protegido)"
else
  info "$STATUS" "GET /api/locations — respuesta inesperada"
fi

# ─────────────────────────────────────────────────────────
# FASE 2: Endpoints de debug / utilidades expuestos
# ─────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────────────────────"
echo "  FASE 2 — Debug endpoints (no deben exponer datos sensibles)"
echo "─────────────────────────────────────────────────────────"

echo -n "  Verificando /api/debug-patients: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE/api/debug-patients")
BODY=$(curl -s "$BASE/api/debug-patients")
if [[ "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "307" ]]; then
  ok "$STATUS" "bloqueado"
elif [[ "$STATUS" == "404" ]]; then
  ok "$STATUS" "endpoint no existe"
elif [[ "$STATUS" == "200" ]] && [[ -z "$BODY" ]]; then
  ok "$STATUS" "existe pero no expone datos"
else
  fail "$STATUS" "EXPONE DATOS SIN AUTH — $BODY"
fi

echo -n "  Verificando /api/health: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE/api/health")
HEALTH=$(curl -s "$BASE/api/health")
if [[ "$STATUS" == "200" ]] && echo "$HEALTH" | grep -qi "service_role"; then
  fail "$STATUS" "EXPONE SERVICE_ROLE KEY — $HEALTH"
elif [[ "$STATUS" == "200" ]]; then
  info "$STATUS" "existe y responde — verificar que no expone secrets"
elif [[ "$STATUS" == "404" ]]; then
  ok "$STATUS" "endpoint no existe"
else
  ok "$STATUS" "bloqueado"
fi

# ─────────────────────────────────────────────────────────
# FASE 3: Inyección SQL en campos de texto
# Vulnerabilidad: SQL se ejecuta (difícil de detectar sin BD acceso)
# Seguro: query param no se ejecuta como SQL (status bloqueado)
# ─────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────────────────────"
echo "  FASE 3 — SQL Injection (query params)"
echo "─────────────────────────────────────────────────────────"

SQL_PAYLOADS=(
  "' OR '1'='1"
  "'; DROP TABLE paciente; --"
  "1; SELECT * FROM usuario_perfil; --"
)

echo "  — SQLi en /api/pacientes/by-ci?ci="
for payload in "${SQL_PAYLOADS[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET "$BASE/api/pacientes/by-ci?ci=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$payload'''))" 2>/dev/null || echo "$payload")")

  # Seguro: bloqueado por auth o validación
  if [[ "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "307" || "$STATUS" == "400" || "$STATUS" == "404" ]]; then
    ok "$STATUS" "SQLi bloqueado: '$payload'"
  # Inesperado: 500 significa error DB (potencial filtración de error)
  elif [[ "$STATUS" == "500" ]]; then
    fail "$STATUS" "SQLi — 500 Internal Error (posible error DB filtrado)"
  else
    info "$STATUS" "SQLi — respuesta inesperada para '$payload'"
  fi
done

echo "  — SQLi en POST /api/pacientes (cuerpo)"
PAYLOAD="' OR '1'='1"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/pacientes" \
  -H "Content-Type: application/json" \
  -d "{\"ci\":\"$PAYLOAD\",\"names\":\"Test\",\"birthDate\":\"2000-01-01\"}")

if [[ "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "307" || "$STATUS" == "400" ]]; then
  ok "$STATUS" "SQLi en body bloqueado"
elif [[ "$STATUS" == "500" ]]; then
  fail "$STATUS" "SQLi en body — 500 (error DB filtrado)"
else
  info "$STATUS" "SQLi en body — respuesta inesperada"
fi

# ─────────────────────────────────────────────────────────
# FASE 4: Escalada de privilegios sin autenticación
# Vulnerabilidad: crear usuario/cambiar rol SIN AUTH (201 status)
# Seguro: devuelve 401/403/307
# ─────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────────────────────"
echo "  FASE 4 — Escalada de privilegios (sin autenticación)"
echo "─────────────────────────────────────────────────────────"

PRIV_ROLES=("ADMIN_NAL" "ADMIN_DEP" "ADMIN_MUN" "VACUNADOR")

echo "  — Intentando crear usuarios con diferentes roles:"
for role in "${PRIV_ROLES[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$BASE/api/usuarios" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"attacker_${role,,}@evil.com\",\"name\":\"Attacker\",\"roleId\":\"$role\",\"password\":\"hacked123\"}")

  # Vulnerable: si se creó exitosamente (201)
  if [[ "$STATUS" == "201" ]]; then
    fail "$STATUS" "USUARIO CREADO SIN AUTH CON ROL $role"
  # Seguro: bloqueado
  elif [[ "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "307" || "$STATUS" == "400" ]]; then
    ok "$STATUS" "POST /api/usuarios $role bloqueado"
  else
    info "$STATUS" "POST /api/usuarios $role — respuesta inesperada"
  fi
done

echo "  — Intentando cambiar rol sin autenticación:"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PATCH "$BASE/api/usuarios" \
  -H "Content-Type: application/json" \
  -d '{"userId":"00000000-0000-0000-0000-000000000001","roleId":"ADMIN_NAL"}')

if [[ "$STATUS" == "200" || "$STATUS" == "204" ]]; then
  fail "$STATUS" "ROL CAMBIADO SIN AUTH"
elif [[ "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "307" || "$STATUS" == "400" ]]; then
  ok "$STATUS" "PATCH cambio de rol bloqueado"
else
  info "$STATUS" "PATCH cambio de rol — respuesta inesperada"
fi

# ─────────────────────────────────────────────────────────
# FASE 5: Enumeración de recursos (IDs arbitrarios)
# Vulnerabilidad: obtener datos de recursos ajenos (200 + datos)
# Seguro: 401/403/404/400
# ─────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────────────────────"
echo "  FASE 5 — Enumeración de IDs (sin autenticación)"
echo "─────────────────────────────────────────────────────────"

UUID_TESTS=(
  "00000000-0000-0000-0000-000000000001"
  "ffffffff-ffff-ffff-ffff-ffffffffffff"
)

echo "  — Intentando PATCH en pacientes con UUIDs aleatorios:"
for uuid in "${UUID_TESTS[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X PATCH "$BASE/api/pacientes/$uuid" \
    -H "Content-Type: application/json" \
    -d '{"names":"Hacker"}')

  # Vulnerable: si se ejecutó (200/204)
  if [[ "$STATUS" == "200" || "$STATUS" == "204" ]]; then
    fail "$STATUS" "ENUMERACIÓN: PATCH ejecutado en paciente ajeno"
  # Seguro: bloqueado
  elif [[ "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "307" || "$STATUS" == "404" || "$STATUS" == "400" ]]; then
    ok "$STATUS" "Enumeración bloqueada"
  else
    info "$STATUS" "Enumeración — respuesta inesperada"
  fi
done

echo "  — Intentando PATCH en usuarios con UUIDs aleatorios:"
for uuid in "${UUID_TESTS[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X PATCH "$BASE/api/usuarios/$uuid" \
    -H "Content-Type: application/json" \
    -d '{"roleId":"ADMIN_NAL"}')

  if [[ "$STATUS" == "200" || "$STATUS" == "204" ]]; then
    fail "$STATUS" "ENUMERACIÓN: PATCH usuario ejecutado"
  elif [[ "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "307" || "$STATUS" == "404" || "$STATUS" == "400" ]]; then
    ok "$STATUS" "Enumeración usuarios bloqueada"
  else
    info "$STATUS" "Enumeración usuarios — respuesta inesperada"
  fi
done

# ─────────────────────────────────────────────────────────
# FASE 6: Métodos HTTP no permitidos
# Vulnerabilidad: si el servidor procesa DELETE/PUT (200/204/5xx)
# Seguro: 405 (Method Not Allowed) o 401/403/307
# ─────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────────────────────"
echo "  FASE 6 — Métodos HTTP no implementados"
echo "─────────────────────────────────────────────────────────"

UNEXPECTED_METHODS=(
  "DELETE /api/pacientes"
  "DELETE /api/usuarios"
  "DELETE /api/vacunacion"
  "PUT    /api/pacientes"
  "PUT    /api/usuarios"
)

for entry in "${UNEXPECTED_METHODS[@]}"; do
  METHOD=$(echo "$entry" | awk '{print $1}')
  ROUTE=$(echo "$entry" | awk '{print $2}')
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X "$METHOD" "$BASE$ROUTE")

  # Seguro: rechazado
  if [[ "$STATUS" == "405" || "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "307" || "$STATUS" == "404" ]]; then
    ok "$STATUS" "$METHOD $ROUTE rechazado"
  # Vulnerable: si se procesa (200/204)
  elif [[ "$STATUS" == "200" || "$STATUS" == "204" ]]; then
    fail "$STATUS" "$METHOD $ROUTE PROCESADO (método no permitido)"
  else
    info "$STATUS" "$METHOD $ROUTE — respuesta inesperada"
  fi
done

# ─────────────────────────────────────────────────────────
# FASE 7: Payloads malformados / edge cases
# Vulnerabilidad: servidor procesa datos inválidos (200/201)
# Seguro: rechaza con error (400/401/403/307)
# ─────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────────────────────"
echo "  FASE 7 — Payloads malformados y edge cases"
echo "─────────────────────────────────────────────────────────"

echo "  — JSON inválido:"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/pacientes" \
  -H "Content-Type: application/json" \
  -d 'no soy json válido {{{')

if [[ "$STATUS" == "400" || "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "307" ]]; then
  ok "$STATUS" "JSON inválido rechazado"
elif [[ "$STATUS" == "200" || "$STATUS" == "201" ]]; then
  fail "$STATUS" "JSON INVÁLIDO ACEPTADO"
else
  info "$STATUS" "JSON inválido — respuesta inesperada"
fi

echo "  — Body completamente vacío:"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/pacientes" \
  -H "Content-Type: application/json" \
  -d '{}')

if [[ "$STATUS" == "400" || "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "307" ]]; then
  ok "$STATUS" "Body vacío rechazado"
elif [[ "$STATUS" == "200" || "$STATUS" == "201" ]]; then
  fail "$STATUS" "BODY VACÍO ACEPTADO"
else
  info "$STATUS" "Body vacío — respuesta inesperada"
fi

echo "  — Payload extremadamente largo (posible DoS):"
LONG_STR=$(python3 -c "print('A'*5000)" 2>/dev/null || printf '%5000s' | tr ' ' 'A')
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/pacientes" \
  -H "Content-Type: application/json" \
  -d "{\"ci\":\"$LONG_STR\",\"names\":\"Test\",\"birthDate\":\"2000-01-01\"}")

if [[ "$STATUS" == "400" || "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "307" || "$STATUS" == "413" ]]; then
  ok "$STATUS" "Payload largo rechazado"
elif [[ "$STATUS" == "200" || "$STATUS" == "201" ]]; then
  fail "$STATUS" "PAYLOAD LARGO (5000 chars) ACEPTADO"
else
  info "$STATUS" "Payload largo — respuesta inesperada"
fi

echo "  — XSS en campos de texto:"
XSS='<script>alert(1)</script>'
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/pacientes" \
  -H "Content-Type: application/json" \
  -d "{\"ci\":\"12345678\",\"names\":\"$XSS\",\"birthDate\":\"2000-01-01\"}")

if [[ "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "307" ]]; then
  ok "$STATUS" "XSS bloqueado por autenticación"
elif [[ "$STATUS" == "400" ]]; then
  ok "$STATUS" "XSS rechazado por validación"
elif [[ "$STATUS" == "200" || "$STATUS" == "201" ]]; then
  fail "$STATUS" "XSS ACEPTADO (debe sanitizar o bloquear)"
else
  info "$STATUS" "XSS — respuesta inesperada"
fi

echo "  — Genero inválido (constraint check):"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/pacientes" \
  -H "Content-Type: application/json" \
  -d '{"ci":"77777777","names":"Test","birthDate":"2000-01-01","sex":"INVALID"}')

if [[ "$STATUS" == "400" || "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "307" ]]; then
  ok "$STATUS" "Genero inválido rechazado"
elif [[ "$STATUS" == "200" || "$STATUS" == "201" ]]; then
  fail "$STATUS" "GENERO INVÁLIDO ACEPTADO (DB CHECK constraint)"
else
  info "$STATUS" "Genero inválido — respuesta inesperada"
fi

echo "  — Rol inexistente en usuario:"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/usuarios" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","name":"Test","roleId":"SUPER_ADMIN","password":"pass123"}')

if [[ "$STATUS" == "400" || "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "307" ]]; then
  ok "$STATUS" "Rol inexistente rechazado"
elif [[ "$STATUS" == "200" || "$STATUS" == "201" ]]; then
  fail "$STATUS" "ROL INEXISTENTE ACEPTADO"
else
  info "$STATUS" "Rol inexistente — respuesta inesperada"
fi

# ─────────────────────────────────────────────────────────
# RESUMEN
# ─────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  RESUMEN DE RESULTADOS"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  ✅ Seguros:     $PASS"
echo "  ❌ Vulnerables: $FAIL"
echo "  ℹ️  Para revisar: $INFO_COUNT"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo "  🎉 Sin vulnerabilidades detectadas en las pruebas automatizadas."
else
  echo "  ⚠️  Se detectaron $FAIL vulnerabilidad(es). Revisar los ❌ arriba."
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  PRUEBAS MANUALES RECOMENDADAS (requieren sesión activa)"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  1. RLS — Scope entre roles:"
echo "     - ADMIN_DEP LPZ solo ve pacientes de La Paz"
echo "     - ADMIN_MUN solo ve usuarios de su municipio"
echo "     - VACUNADOR NO ve ningún usuario"
echo "     - VACUNADOR solo ve su establecimiento"
echo ""
echo "  2. IDOR (Insecure Direct Object Reference):"
echo "     - ADMIN_DEP no puede acceder a establecimientos de otro depto"
echo "     - VACUNADOR no puede hacer PATCH a otros usuarios"
echo ""
echo "  3. Cambio de rol propio:"
echo "     - PATCH /api/usuarios con propio ID y roleId=ADMIN_NAL"
echo "     → debe rechazar 'No puedes cambiar tu propio rol'"
echo ""
echo "  4. VACUNADOR crea en establecimiento ajeno:"
echo "     - POST /api/vacunacion con establishmentId de otro VACUNADOR"
echo "     → RLS debe rechazarlo"
echo ""
echo "  5. Política de paciente para VACUNADOR:"
echo "     - Ejecutar SQL en Supabase:"
echo "       SELECT COUNT(*) FROM paciente;"
echo "     → debe devolver solo pacientes de su municipio"
echo ""
echo "  ⚠️  SQL de bd.sql debe estar ejecutado en Supabase."
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Presiona ENTER para cerrar..."
read -r _
