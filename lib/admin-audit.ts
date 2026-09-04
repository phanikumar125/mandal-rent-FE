import type { getSupabaseAdmin } from "@/lib/server-auth";

export async function recordAdminAudit(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await supabase.from("admin_audit_logs").insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  });
  if (error) throw error;
}
