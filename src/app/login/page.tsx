import { cookies } from "next/headers";
import { getDict, parseLang, UI_LANG_COOKIE } from "@/lib/i18n";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const dict = getDict(parseLang((await cookies()).get(UI_LANG_COOKIE)?.value));
  return (
    <main className="flex h-full items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">{dict["app.subtitle"]}</p>
        <h1 className="mt-1 mb-5 text-xl font-bold">{dict["login.title"]}</h1>
        <LoginForm dict={dict} />
      </div>
    </main>
  );
}
