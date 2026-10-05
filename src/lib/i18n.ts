// Словари интерфейса админки. Тексты бота хранятся в сценарии (Flow), а не здесь.
import kk from "@/locales/kk.json";
import ru from "@/locales/ru.json";
import type { Lang } from "./flow";

export type Dict = typeof ru;
export type DictKey = keyof Dict;

// Проверка на этапе компиляции: в kk.json те же ключи, что и в ru.json.
const dicts: Record<Lang, Dict> = { kk: kk satisfies Dict, ru };

export const UI_LANG_COOKIE = "ui_lang";

export function getDict(lang: Lang): Dict {
  return dicts[lang];
}

export function parseLang(value: string | undefined): Lang {
  return value === "ru" ? "ru" : "kk";
}
