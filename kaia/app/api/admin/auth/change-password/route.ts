import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  getAdminSessionUser,
  hashAdminPassword,
  verifyAdminPassword,
} from "@/lib/admin/auth";
import { ensureAdminSchema } from "@/lib/admin/schema";

type ChangePasswordBody = {
  currentPassword?: unknown;
  newPassword?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    await ensureAdminSchema();
    const user = await getAdminSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ChangePasswordBody;
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (newPassword.length < 10 || newPassword.length > 200) {
      return NextResponse.json(
        { error: "New password must be between 10 and 200 characters." },
        { status: 400 }
      );
    }

    const db = getDb();
    const row = await db
      .prepare(
        `SELECT id, password_hash, password_salt
         FROM admin_users
         WHERE id = ?`
      )
      .bind(user.id)
      .first<{ id: string; password_hash: string; password_salt: string }>();

    if (!row) {
      return NextResponse.json({ error: "Admin user not found." }, { status: 404 });
    }

    const validCurrent = await verifyAdminPassword(
      currentPassword,
      row.password_salt,
      row.password_hash
    );
    if (!validCurrent) {
      return NextResponse.json({ error: "Current password is invalid." }, { status: 401 });
    }

    const nextHash = await hashAdminPassword(newPassword);
    await db
      .prepare(
        `UPDATE admin_users
         SET password_hash = ?, password_salt = ?, must_change_password = 0, password_updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(nextHash.hash, nextHash.salt, user.id)
      .run();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to change admin password", error);
    return NextResponse.json({ error: "Failed to change password." }, { status: 500 });
  }
}
