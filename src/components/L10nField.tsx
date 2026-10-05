"use client";

import { LANGS, type L10n } from "@/lib/flow";

const FLAG = { kk: "🇰🇿 KZ", ru: "🇷🇺 RU" } as const;

/** Поле с вводом на двух языках. Пустой перевод подсвечивается красным. */
export default function L10nField({
  value,
  onChange,
  multiline = false,
  maxLength,
}: {
  value: L10n;
  onChange: (v: L10n) => void;
  multiline?: boolean;
  maxLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      {LANGS.map((lang) => {
        const empty = !value[lang].trim();
        const props = {
          value: value[lang],
          maxLength,
          onChange: (e: { target: { value: string } }) => onChange({ ...value, [lang]: e.target.value }),
          className: `field ${empty ? "!border-danger/60 bg-red-50/40" : ""}`,
        };
        return (
          <div key={lang} className="flex items-start gap-2">
            <span className="w-11 shrink-0 pt-1.5 text-[11px] font-semibold text-slate-500">{FLAG[lang]}</span>
            {multiline ? <textarea rows={4} {...props} /> : <input {...props} />}
          </div>
        );
      })}
    </div>
  );
}
