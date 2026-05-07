export type MetricCard = {
  label: string;
  value: string;
  delta: string;
  tone: "emerald" | "amber" | "cyan" | "rose";
};

export type CoverageRow = {
  label: string;
  value: string;
  percent: number;
};

export type TimelineItem = {
  title: string;
  detail: string;
  meta: string;
  status: "ready" | "alert" | "review";
};

export type EventRow = {
  patient: string;
  vaccine: string;
  facility: string;
  date: string;
  dose: string;
  status: string;
};

export type VaccineRow = {
  code: string;
  name: string;
  doses: string;
  route: string;
};

export type FacilityRow = {
  name: string;
  municipality: string;
  level: string;
  active: boolean;
};

export const navigation = [
  { label: "Dashboard", active: true },
  { label: "Pacientes", active: false },
  { label: "Vacunacion", active: false },
  { label: "Catalogos", active: false },
  { label: "Usuarios", active: false },
];

export const metrics: MetricCard[] = [
  {
    label: "Eventos capturados",
    value: "1,284",
    delta: "+12% vs. semana anterior",
    tone: "emerald",
  },
  {
    label: "Pacientes activos",
    value: "843",
    delta: "+48 nuevos registros",
    tone: "cyan",
  },
  {
    label: "Cobertura operativa",
    value: "97%",
    delta: "Sobre la meta semanal",
    tone: "amber",
  },
  {
    label: "Registros por revisar",
    value: "14",
    delta: "Faltan lote, geolocalizacion o firma",
    tone: "rose",
  },
];

export const coverage: CoverageRow[] = [
  { label: "La Paz urbana", value: "92%", percent: 92 },
  { label: "Santa Cruz", value: "88%", percent: 88 },
  { label: "Rural movil", value: "74%", percent: 74 },
  { label: "Campana estacional", value: "61%", percent: 61 },
];

export const timeline: TimelineItem[] = [
  {
    title: "Brigada en ruta",
    detail: "La Paz - Coroico / prioridad rural",
    meta: "12 pacientes pendientes",
    status: "ready",
  },
  {
    title: "Lote por vencer",
    detail: "LOT-GSK-2025-173 en almacen",
    meta: "Vence en 18 dias",
    status: "alert",
  },
  {
    title: "Validacion de rol",
    detail: "Admin departamental con alcance parcial",
    meta: "2 cambios en espera",
    status: "review",
  },
  {
    title: "Auditoria lista",
    detail: "Ultimos 120 eventos trazables",
    meta: "Sin borrados detectados",
    status: "ready",
  },
];

export const recentEvents: EventRow[] = [
  {
    patient: "Camila Villca Paredes",
    vaccine: "Pentavalente",
    facility: "Hospital de la Mujer Cota Cota",
    date: "2025-05-21",
    dose: "2da",
    status: "Completo",
  },
  {
    patient: "Gonzalo Fernandez Yujra",
    vaccine: "dT Adulto",
    facility: "Centro Materno Infantil San Antonio",
    date: "2025-08-22",
    dose: "1ra",
    status: "Completo",
  },
  {
    patient: "Lucia Tarqui Mendoza",
    vaccine: "BCG",
    facility: "Posta Sanitaria Villa Victoria",
    date: "2025-12-02",
    dose: "1ra",
    status: "Observado",
  },
  {
    patient: "Raul Gutierrez Terrazas",
    vaccine: "Antiamarilica",
    facility: "Centro Ambulatorio Sopocachi",
    date: "2025-06-07",
    dose: "1ra",
    status: "Completo",
  },
  {
    patient: "Paola Bustamante Herrera",
    vaccine: "VPH",
    facility: "Posta de Salud Litoral",
    date: "2024-12-13",
    dose: "1ra",
    status: "Completo",
  },
];

export const vaccineCatalog: VaccineRow[] = [
  { code: "VAC-001", name: "BCG", doses: "1", route: "Intradermica" },
  { code: "VAC-003", name: "Pentavalente", doses: "5", route: "Intramuscular" },
  { code: "VAC-019", name: "SRP", doses: "2", route: "Subcutanea" },
  { code: "VAC-024", name: "dT Adulto", doses: "1", route: "Intramuscular" },
  { code: "VAC-025", name: "Influenza Estacional", doses: "1", route: "Intramuscular" },
];

export const facilities: FacilityRow[] = [
  {
    name: "Hospital de la Mujer Cota Cota",
    municipality: "La Paz",
    level: "3er nivel",
    active: true,
  },
  {
    name: "Centro Materno Infantil San Antonio",
    municipality: "Viacha",
    level: "1er nivel",
    active: true,
  },
  {
    name: "Posta Sanitaria Villa Victoria",
    municipality: "Achacachi",
    level: "1er nivel",
    active: true,
  },
  {
    name: "Puesto de Salud Tiquipaya Norte",
    municipality: "Guanay",
    level: "1er nivel",
    active: false,
  },
];

export const alerts = [
  "Revisar 14 eventos con registro incompleto",
  "Validar lotes proximos a vencer en dos establecimientos",
  "Sincronizar alcance de usuarios departamentales",
  "Confirmar codigos de municipios para carga inicial",
];