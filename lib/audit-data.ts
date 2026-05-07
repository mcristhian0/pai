import "server-only";

export type AuditItem = {
  id: string;
  user: string;
  action: string;
  table: string;
  record: string;
  date: string;
  detail: string;
};

export type AuditSnapshot = {
  live: boolean;
  tableAvailable: boolean;
  items: AuditItem[];
  source: "supabase" | "fallback";
};

export async function getAuditSnapshot(_search: string): Promise<AuditSnapshot> {
  return {
    live: false,
    tableAvailable: false,
    items: [],
    source: "fallback",
  };
}
