import type { getSupabaseAdmin } from "@/lib/server-auth";

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

export type NotificationInput = {
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string | null;
};

export async function notifyUser(supabase: SupabaseAdmin, input: NotificationInput) {
  try {
    let query = supabase.from("notifications").select("id").eq("user_id", input.userId).eq("type", input.type).limit(1);
    query = input.entityId ? query.eq("entity_id", input.entityId) : query.is("entity_id", null);
    const { data: existing, error: existingError } = await query.maybeSingle();
    if (existingError) throw existingError;
    if (existing) return;
    const { error } = await supabase.from("notifications").insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
    });
    if (error) throw error;
  } catch (error) {
    console.error("Notification creation error", error);
  }
}

export async function notifyAdmins(supabase: SupabaseAdmin, input: Omit<NotificationInput, "userId">) {
  const { data: admins, error } = await supabase.from("profiles").select("id").eq("role", "admin").eq("is_active", true);
  if (error) {
    console.error("Admin notification lookup error", error);
    return;
  }
  await Promise.all((admins ?? []).map((admin) => notifyUser(supabase, { ...input, userId: admin.id })));
}
