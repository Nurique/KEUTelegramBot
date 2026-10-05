"use client";

import L10nField from "@/components/L10nField";
import type { Flow, validateFlow } from "@/lib/flow";
import type { Dict } from "@/lib/i18n";

interface Props {
  settings: Flow["settings"];
  onChange: (s: Flow["settings"]) => void;
  issues: ReturnType<typeof validateFlow>;
  nodes: { id: string; data: { title: string } }[];
  onSelect: (id: string) => void;
  dict: Dict;
}

export default function SettingsPanel({ settings, onChange, issues, nodes, onSelect, dict }: Props) {
  const title = (id?: string) => nodes.find((n) => n.id === id)?.data.title ?? "";
  return (
    <div className="space-y-5 p-4">
      <p className="rounded-md bg-brand-soft p-3 text-sm text-brand">{dict["panel.hint"]}</p>

      <section>
        <h2 className="mb-2 font-semibold">{dict["issues.title"]}</h2>
        {issues.length === 0 ? (
          <p className="text-sm text-emerald-600">✓ {dict["issues.none"]}</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {issues.map((i, k) => (
              <li key={k}>
                <button
                  className="text-left hover:underline disabled:no-underline"
                  disabled={!i.nodeId}
                  onClick={() => i.nodeId && onSelect(i.nodeId)}
                >
                  <span className="text-danger">⚠</span> <b>{title(i.nodeId)}</b>
                  {i.lang && <span className="text-slate-400"> [{i.lang.toUpperCase()}]</span>}{" "}
                  — {dict[`issues.${i.code}` as keyof Dict]}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-4">
        <h2 className="font-semibold">⚙ {dict["toolbar.settings"]}</h2>
        <div>
          <label className="label">{dict["settings.chooseLanguage"]}</label>
          <textarea
            rows={3}
            className="field"
            value={settings.chooseLanguage}
            onChange={(e) => onChange({ ...settings, chooseLanguage: e.target.value })}
          />
        </div>
        <div>
          <label className="label">{dict["settings.menuButton"]}</label>
          <L10nField value={settings.menuButton} onChange={(menuButton) => onChange({ ...settings, menuButton })} />
        </div>
        <div>
          <label className="label">{dict["settings.fallback"]}</label>
          <L10nField
            multiline
            value={settings.fallback}
            onChange={(fallback) => onChange({ ...settings, fallback })}
          />
        </div>
      </section>
    </div>
  );
}
