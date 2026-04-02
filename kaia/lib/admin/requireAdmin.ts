import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/admin/auth";
import { ensureAdminSchema } from "@/lib/admin/schema";

type RequireAdminOptions = {
  requirePasswordReady?: boolean;
};

export async function requireAdmin(
  request: NextRequest,
  options: RequireAdminOptions = {}
) {
  await ensureAdminSchema();
  const user = await getAdminSessionUser(request);
  if (!user) {
    return {
      user: null,
      unauthorized: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (user.mustChangePassword && options.requirePasswordReady) {
    return {
      user: null,
      unauthorized: NextResponse.json(
        { error: "Password change required.", code: "PASSWORD_CHANGE_REQUIRED" },
        { status: 403 }
      ),
    };
  }
  return { user, unauthorized: null };
}
