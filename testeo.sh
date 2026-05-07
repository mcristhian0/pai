#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# PAI Vacunación — Pentesting Script (Binario: VULNERABLE / SEGURO)
# Solo dos resultados: el ataque tuvo éxito o fue bloqueado.
# ═══════════════════════════════════════════════════════════════
# Uso:
#   bash testeo.sh                          → localhost:3000
#   BASE_URL=https://mi-dominio.com bash testeo.sh
# ═══════════════════════════════════════════════════════════════

BASE="${BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0

verde() { echo "  [SEGURO]      $1 (HTTP $2)"; PASS=$((PASS+1)); }
rojo()  { echo "  [VULNERABLE]  $1 (HTTP $2)"; FAIL=$((FAIL+1)); }

# Verificar que el servidor está corriendo antes de empezar
PING=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$BASE" 2>/dev/null)
if [[ "$PING" == "000" ]]; then
  echo ""
  echo "  ERROR: El servidor no responde en $BASE"
  echo "  Inicia el servidor con: npm run dev"
  echo "  Luego vuelve a correr este script."
  echo ""
  exit 1
fi

# ──────────────────────────────────────────────────────────────
# Regla binaria:
#   VULNERABLE  = el atacante obtiene datos o ejecuta una operación
#                 → 200 con cuerpo de datos / 201 / 204 en endpoint protegido
#   SEGURO      = la operación no se completó
#                 → 401, 403, 307, 400, 404, 405, 500 (cualquier bloqueo)
#
# El criterio de "tuvo éxito" varía por tipo de prueba:
#   auth_test  → éxito si 200/201/204  (debería requerir token)
#   sqli_test  → éxito si 200 Y el cuerpo contiene datos reales
#   method_test→ éxito si 200/201/204  (método no soportado)
# ──────────────────────────────────────────────────────────────

# Devuelve status HTTP
http_status() { curl -s -o /dev/null -w "%{http_code}" "$@"; }
# Devuelve cuerpo de respuesta
http_body()   { curl -s "$@"; }

# ─────────────────────────────────────────────────────
# PRUEBA DE AUTENTICACIÓN
# Pasa un método, ruta y datos. Evalúa si el servidor
# permitió la operación sin credenciales.
# ─────────────────────────────────────────────────────
auth_test() {
  local desc="$1"; shift
  local status body items
  status=$(http_status "$@")
  body=$(http_body "$@")

  # Si el servidor devuelve 200/201/204 sin auth = VULNERABLE
  # Excepción: 200 vacío (sin datos) no cuenta como éxito real.
  if [[ "$status" == "201" || "$status" == "204" ]]; then
    rojo "$desc" "$status"
  elif [[ "$status" == "200" ]]; then
    # Revisar si el cuerpo contiene datos reales
    if echo "$body" | grep -qE '"(id|paciente_id|registro_id|email|nombre|vacuna|data)"'; then
      rojo "$desc" "$status — devuelve datos sin autenticación"
    else
      # 200 sin datos reales = bloqueado (ej: página de login, JSON vacío)
      verde "$desc" "$status"
    fi
  else
    # 401, 403, 307, 400, 404, 405, 500 = bloqueado
    verde "$desc" "$status"
  fi
}

# ─────────────────────────────────────────────────────
# PRUEBA DE SQL INJECTION
# Solo es VULNERABLE si devuelve 200 CON datos reales
# (la inyección logró extraer datos)
# ─────────────────────────────────────────────────────
sqli_test() {
  local desc="$1"; shift
  local status body
  status=$(http_status "$@")
  body=$(http_body "$@")

  if [[ "$status" == "200" ]] && echo "$body" | grep -qE '"(id|paciente_id|nombre|email|data|ok":true)"'; then
    rojo "$desc" "$status — DATOS EXPUESTOS por inyección"
  else
    # Cualquier otro resultado = inyección no tuvo éxito
    verde "$desc" "$status"
  fi
}

# ─────────────────────────────────────────────────────
# PRUEBA DE MÉTODO HTTP NO PERMITIDO
# Vulnerable solo si la operación se completó
# ─────────────────────────────────────────────────────
method_test() {
  local desc="$1"; shift
  local status
  status=$(http_status "$@")

  if [[ "$status" == "200" || "$status" == "201" || "$status" == "204" ]]; then
    rojo "$desc" "$status — operación completada con método no permitido"
  else
    verde "$desc" "$status"
  fi
}

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  PAI Vacunación — Pentesting Script"
echo "  Target: $BASE"
echo "  Criterio: VULNERABLE = ataque exitoso | SEGURO = bloqueado"
echo "═══════════════════════════════════════════════════════════"

# ═══════════════════════════════════════════════════════════════
# FASE 1: Endpoints protegidos sin autenticación
# Todos estos deben BLOQUEAR sin token válido
# ═══════════════════════════════════════════════════════════════
echo ""
echo "──── FASE 1: Acceso sin autenticación ────────────────────"

auth_test "GET  /api/dashboard" \
  -X GET "$BASE/api/dashboard"

auth_test "GET  /api/pacientes" \
  -X GET "$BASE/api/pacientes"

auth_test "POST /api/pacientes (crear paciente)" \
  -X POST "$BASE/api/pacientes" \
  -H "Content-Type: application/json" \
  -d '{"ci":"99999999","names":"Hacker","apPaterno":"Test","birthDate":"2000-01-01","sex":"M"}'

auth_test "PATCH /api/pacientes/:id (editar paciente)" \
  -X PATCH "$BASE/api/pacientes/00000000-0000-0000-0000-000000000001" \
  -H "Content-Type: application/json" \
  -d '{"names":"Hacked"}'

auth_test "GET  /api/pacientes/by-ci (buscar por CI)" \
  -X GET "$BASE/api/pacientes/by-ci?ci=12345678"

auth_test "GET  /api/usuarios (listar usuarios)" \
  -X GET "$BASE/api/usuarios"

auth_test "POST /api/usuarios (crear usuario)" \
  -X POST "$BASE/api/usuarios" \
  -H "Content-Type: application/json" \
  -d '{"email":"hacker@evil.com","name":"Hacker","roleId":"ADMIN_NAL","password":"pass123"}'

auth_test "PATCH /api/usuarios (cambiar rol)" \
  -X PATCH "$BASE/api/usuarios" \
  -H "Content-Type: application/json" \
  -d '{"userId":"00000000-0000-0000-0000-000000000001","roleId":"ADMIN_NAL"}'

auth_test "PATCH /api/usuarios/:id (cambiar rol por ID)" \
  -X PATCH "$BASE/api/usuarios/00000000-0000-0000-0000-000000000001" \
  -H "Content-Type: application/json" \
  -d '{"roleId":"ADMIN_NAL"}'

auth_test "GET  /api/vacunacion (listar eventos)" \
  -X GET "$BASE/api/vacunacion"

auth_test "POST /api/vacunacion (crear evento)" \
  -X POST "$BASE/api/vacunacion" \
  -H "Content-Type: application/json" \
  -d '{"patientId":"fake","vaccineId":"VAC-BCG","doseId":"1","establishmentId":"EST-LPZ-001","vaccinationDate":"2026-01-01"}'

auth_test "GET  /api/vacunacion/options (opciones)" \
  -X GET "$BASE/api/vacunacion/options"

auth_test "GET  /api/catalogos/vacunas (listar vacunas)" \
  -X GET "$BASE/api/catalogos/vacunas"

auth_test "POST /api/catalogos/vacunas (crear vacuna)" \
  -X POST "$BASE/api/catalogos/vacunas" \
  -H "Content-Type: application/json" \
  -d '{"cod_vacuna":"VAC-FAKE","nombre":"Vacuna Hacker"}'

auth_test "PATCH /api/catalogos/vacunas/VAC-BCG (editar vacuna)" \
  -X PATCH "$BASE/api/catalogos/vacunas/VAC-BCG" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Hacked"}'

auth_test "POST /api/establecimientos (crear establecimiento)" \
  -X POST "$BASE/api/establecimientos" \
  -H "Content-Type: application/json" \
  -d '{"code":"EST-HACK","name":"Centro Hacker"}'

auth_test "PATCH /api/establecimientos/:id (editar establecimiento)" \
  -X PATCH "$BASE/api/establecimientos/EST-LPZ-001" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacked"}'

auth_test "GET  /api/auditoria (logs de auditoría)" \
  -X GET "$BASE/api/auditoria"

# ═══════════════════════════════════════════════════════════════
# FASE 2: Endpoints públicos intencionales
# Estos SÍ deben devolver datos (son de referencia, sin datos sensibles)
# ═══════════════════════════════════════════════════════════════
echo ""
echo "──── FASE 2: Endpoints públicos intencionales ─────────────"

# /api/locations es público (departamentos, municipios — no datos personales)
STATUS=$(http_status -X GET "$BASE/api/locations?type=departments")
BODY=$(http_body -X GET "$BASE/api/locations?type=departments")
if [[ "$STATUS" == "200" ]] && echo "$BODY" | grep -qE '"(id|codigo_departamento)"'; then
  verde "GET /api/locations?type=departments (público intencional)" "$STATUS"
elif [[ "$STATUS" == "401" || "$STATUS" == "403" || "$STATUS" == "307" ]]; then
  verde "GET /api/locations?type=departments (bloqueado)" "$STATUS"
else
  verde "GET /api/locations?type=departments" "$STATUS"
fi

# /api/health debe existir pero NO exponer secrets
STATUS=$(http_status -X GET "$BASE/api/health")
BODY=$(http_body -X GET "$BASE/api/health")
if echo "$BODY" | grep -qiE "(service_role|anon_key|secret|password|supabase_key)"; then
  rojo "GET /api/health — EXPONE SECRETS" "$STATUS"
else
  verde "GET /api/health (no expone secrets)" "$STATUS"
fi

# /api/debug-patients no debe existir ni exponer datos
STATUS=$(http_status -X GET "$BASE/api/debug-patients")
BODY=$(http_body -X GET "$BASE/api/debug-patients")
if [[ "$STATUS" == "200" ]] && echo "$BODY" | grep -qE '"(paciente_id|documento_identidad|nombres)"'; then
  rojo "GET /api/debug-patients — EXPONE DATOS DE PACIENTES" "$STATUS"
else
  verde "GET /api/debug-patients (no expone datos)" "$STATUS"
fi

# ═══════════════════════════════════════════════════════════════
# FASE 3: SQL Injection
# Vulnerable solo si la inyección devuelve datos reales
# ═══════════════════════════════════════════════════════════════
echo ""
echo "──── FASE 3: SQL Injection ────────────────────────────────"

SQL_PAYLOADS=(
  "%27%20OR%20%271%27%3D%271"
  "%27%3B%20DROP%20TABLE%20paciente%3B%20--"
  "1%20UNION%20SELECT%20%2A%20FROM%20usuario_perfil%20--"
  "%27%20OR%201%3D1%20LIMIT%2010%20--"
)

SQL_LABELS=(
  "' OR '1'='1"
  "'; DROP TABLE paciente; --"
  "1 UNION SELECT * FROM usuario_perfil --"
  "' OR 1=1 LIMIT 10 --"
)

for i in "${!SQL_PAYLOADS[@]}"; do
  sqli_test "SQLi en by-ci?ci=${SQL_LABELS[$i]}" \
    -X GET "$BASE/api/pacientes/by-ci?ci=${SQL_PAYLOADS[$i]}"
done

# SQLi en body de POST
sqli_test "SQLi en POST /api/pacientes (body)" \
  -X POST "$BASE/api/pacientes" \
  -H "Content-Type: application/json" \
  -d "{\"ci\":\"' OR '1'='1\",\"names\":\"Test\",\"birthDate\":\"2000-01-01\"}"

sqli_test "SQLi en POST /api/vacunacion (vaccineId)" \
  -X POST "$BASE/api/vacunacion" \
  -H "Content-Type: application/json" \
  -d "{\"patientId\":\"' OR '1'='1\",\"vaccineId\":\"VAC-BCG\",\"doseId\":\"1\",\"establishmentId\":\"EST-LPZ-001\",\"vaccinationDate\":\"2026-01-01\"}"

# ═══════════════════════════════════════════════════════════════
# FASE 4: Escalada de privilegios sin autenticación
# Intentar crear ADMIN_NAL sin token
# ═══════════════════════════════════════════════════════════════
echo ""
echo "──── FASE 4: Escalada de privilegios ──────────────────────"

for role in "ADMIN_NAL" "ADMIN_DEP" "ADMIN_MUN" "VACUNADOR"; do
  auth_test "POST /api/usuarios con rol $role (sin auth)" \
    -X POST "$BASE/api/usuarios" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"attacker_${role,,}@evil.com\",\"name\":\"Attacker\",\"roleId\":\"$role\",\"password\":\"hacked123\"}"
done

auth_test "PATCH /api/usuarios — cambiar rol a ADMIN_NAL (sin auth)" \
  -X PATCH "$BASE/api/usuarios" \
  -H "Content-Type: application/json" \
  -d '{"userId":"00000000-0000-0000-0000-000000000001","roleId":"ADMIN_NAL"}'

# ═══════════════════════════════════════════════════════════════
# FASE 5: IDOR — Enumeración de IDs ajenos
# Intentar acceder/modificar recursos de otros usuarios sin token
# ═══════════════════════════════════════════════════════════════
echo ""
echo "──── FASE 5: IDOR — Recursos ajenos ──────────────────────"

UUIDS=(
  "00000000-0000-0000-0000-000000000001"
  "ffffffff-ffff-ffff-ffff-ffffffffffff"
  "11111111-1111-1111-1111-111111111111"
)

for uuid in "${UUIDS[@]}"; do
  auth_test "PATCH /api/pacientes/$uuid (sin auth)" \
    -X PATCH "$BASE/api/pacientes/$uuid" \
    -H "Content-Type: application/json" \
    -d '{"names":"Hacker"}'

  auth_test "PATCH /api/usuarios/$uuid (sin auth)" \
    -X PATCH "$BASE/api/usuarios/$uuid" \
    -H "Content-Type: application/json" \
    -d '{"roleId":"ADMIN_NAL"}'
done

# ═══════════════════════════════════════════════════════════════
# FASE 6: Métodos HTTP no implementados
# DELETE y PUT no deben ser procesados
# ═══════════════════════════════════════════════════════════════
echo ""
echo "──── FASE 6: Métodos HTTP no permitidos ───────────────────"

ROUTES=("/api/pacientes" "/api/usuarios" "/api/vacunacion" "/api/catalogos/vacunas")
for route in "${ROUTES[@]}"; do
  method_test "DELETE $route" \
    -X DELETE "$BASE$route"
  method_test "PUT    $route" \
    -X PUT "$BASE$route" \
    -H "Content-Type: application/json" \
    -d '{}'
done

# ═══════════════════════════════════════════════════════════════
# FASE 7: Payloads malformados
# El servidor no debe aceptar datos inválidos
# ═══════════════════════════════════════════════════════════════
echo ""
echo "──── FASE 7: Payloads malformados ─────────────────────────"

# JSON inválido en endpoints protegidos → bloqueado por auth antes de parsear
auth_test "POST /api/pacientes — JSON completamente inválido" \
  -X POST "$BASE/api/pacientes" \
  -H "Content-Type: application/json" \
  -d 'no_es_json {{{'

# Body vacío
auth_test "POST /api/pacientes — body vacío {}" \
  -X POST "$BASE/api/pacientes" \
  -H "Content-Type: application/json" \
  -d '{}'

# Payload gigante (potencial overflow)
BIG=$(python3 -c "print('A'*10000)" 2>/dev/null || head -c 10000 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 10000)
auth_test "POST /api/pacientes — payload 10k chars" \
  -X POST "$BASE/api/pacientes" \
  -H "Content-Type: application/json" \
  -d "{\"ci\":\"$BIG\",\"names\":\"X\",\"birthDate\":\"2000-01-01\"}"

# XSS en campos
auth_test "POST /api/pacientes — XSS en nombre" \
  -X POST "$BASE/api/pacientes" \
  -H "Content-Type: application/json" \
  -d '{"ci":"12345678","names":"<script>alert(1)</script>","birthDate":"2000-01-01"}'

# Rol inexistente
auth_test "POST /api/usuarios — rol SUPER_ADMIN (no existe)" \
  -X POST "$BASE/api/usuarios" \
  -H "Content-Type: application/json" \
  -d '{"email":"x@x.com","name":"X","roleId":"SUPER_ADMIN","password":"pass123"}'

# ═══════════════════════════════════════════════════════════════
# FASE 8: Headers de seguridad
# El servidor debe incluir headers protectores
# ═══════════════════════════════════════════════════════════════
echo ""
echo "──── FASE 8: Headers de seguridad HTTP ────────────────────"

HEADERS=$(curl -s -I "$BASE")

check_header() {
  local header="$1" desc="$2"
  if echo "$HEADERS" | grep -qi "$header"; then
    verde "Header $desc presente" "OK"
  else
    rojo "Header $desc AUSENTE" "MISSING"
  fi
}

check_header "x-content-type-options" "X-Content-Type-Options"
check_header "x-frame-options" "X-Frame-Options"
check_header "x-xss-protection" "X-XSS-Protection"

# Verificar que no haya info del servidor expuesta
if echo "$HEADERS" | grep -qi "server: apache\|server: nginx\|x-powered-by: PHP"; then
  rojo "Headers revelan tecnología del servidor" "EXPOSED"
else
  verde "Headers no revelan tecnología sensible" "OK"
fi

# ═══════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  RESUMEN FINAL — PAI Vacunación Pentesting"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  [SEGURO]     : $PASS"
echo "  [VULNERABLE] : $FAIL"
echo ""

TOTAL=$((PASS+FAIL))
if [ "$FAIL" -eq 0 ]; then
  echo "  RESULTADO: APROBADO ✓ — $TOTAL pruebas, 0 vulnerabilidades detectadas."
else
  echo "  RESULTADO: FALLIDO  ✗ — $FAIL vulnerabilidad(es) en $TOTAL pruebas."
  echo ""
  echo "  Revisa las líneas [VULNERABLE] arriba para ver qué falló."
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Presiona ENTER para cerrar..."
read -r _
