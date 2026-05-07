import "server-only";

function requireServerEnv(name: "SUPABASE_SERVICE_ROLE_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}

export const serverEnv = {
  supabaseServiceRoleKey: requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
};