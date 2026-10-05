"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";
import type { Dict } from "@/lib/i18n";

export default function LoginForm({ dict }: { dict: Dict }) {
  const [state, action, pending] = useActionState(login, { error: false });
  return (
    <form action={action} className="space-y-3">
      <label className="label" htmlFor="password">{dict["login.password"]}</label>
      <input id="password" name="password" type="password" required autoFocus className="field" />
      {state.error && <p className="text-sm text-danger">{dict["login.error"]}</p>}
      <button className="btn-primary w-full justify-center" disabled={pending}>
        {dict["login.submit"]}
      </button>
    </form>
  );
}
