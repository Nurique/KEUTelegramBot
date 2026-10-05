// Проверяет, что в src/locales/kk.json и ru.json одинаковый набор ключей и нет пустых значений.
import { readFileSync } from "node:fs";

const load = (l) => JSON.parse(readFileSync(new URL(`../src/locales/${l}.json`, import.meta.url)));
const dicts = { kk: load("kk"), ru: load("ru") };
const all = new Set(Object.values(dicts).flatMap(Object.keys));
const problems = [];
for (const [lang, d] of Object.entries(dicts)) {
  for (const key of all) {
    if (!(key in d)) problems.push(`${lang}.json: нет ключа "${key}"`);
    else if (!String(d[key]).trim()) problems.push(`${lang}.json: пустое значение "${key}"`);
  }
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`i18n OK: ${all.size} ключей в kk и ru`);
