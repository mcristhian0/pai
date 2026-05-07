import { NextResponse } from "next/server";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerSupabaseAdminClient();

    // Test 1: Count all patients
    const countResult = await supabase
      .from("paciente")
      .select("paciente_id", { count: "exact", head: true });

    console.log("Count result:", countResult);

    // Test 2: Fetch first 5 patients
    const patientsResult = await supabase
      .from("paciente")
      .select("paciente_id, nombres, documento_identidad, actualizado_en")
      .limit(5);

    console.log("Patients result:", patientsResult);

    return NextResponse.json({
      ok: true,
      countError: countResult.error,
      countData: countResult.data,
      countCount: countResult.count,
      patientsError: patientsResult.error,
      patientsCount: patientsResult.data?.length,
      patientsSample: patientsResult.data?.slice(0, 3),
    });
  } catch (error) {
    console.error("Error in debug-patients:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
