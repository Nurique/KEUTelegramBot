"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkPassword, createSession, SESSION_COOKIE, verifySession } from "@/lib/auth";
import { saveFlow } from "@/lib/db";
import { flowSchema, LANGS, type Lang } from "@/lib/flow";
import { UI_LANG_COOKIE } from "@/lib/i18n";

async function requireAdmin() {
  const store = await cookies();
  if (!(await verifySession(store.get(SESSION_COOKIE)?.value))) throw new Error("Unauthorized");
}

export async function login(_prev: { error: boolean }, form: FormData) {
  if (!(await checkPassword(String(form.get("password") ?? "")))) return { error: true };
  const session = await createSession();
  (await cookies()).set(SESSION_COOKIE, session.value, {
    httpOnly: true,
    sameSite: "lax",
    // COOKIE_SECURE=false — только если админка открыта по голому HTTP (без reverse proxy).
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    maxAge: session.maxAge,
    path: "/",
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

export async function setUiLang(lang: Lang) {
  if (!LANGS.includes(lang)) return;
  (await cookies()).set(UI_LANG_COOKIE, lang, { maxAge: 60 * 60 * 24 * 365, path: "/" });
}

export async function saveFlowAction(input: unknown): Promise<{ ok: boolean }> {
  await requireAdmin();
  const parsed = flowSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  saveFlow(parsed.data);
  return { ok: true };
}
