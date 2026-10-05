import { cookies } from "next/headers";
import { loadFlow, userStats } from "@/lib/db";
import { getDict, parseLang, UI_LANG_COOKIE } from "@/lib/i18n";
import FlowEditor from "@/components/FlowEditor";

export default async function Home() {
  const lang = parseLang((await cookies()).get(UI_LANG_COOKIE)?.value);
  return (
    <FlowEditor initialFlow={loadFlow()} stats={userStats()} uiLang={lang} dict={getDict(lang)} />
  );
}
