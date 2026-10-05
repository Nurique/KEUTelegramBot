"use client";

import L10nField from "@/components/L10nField";
import { LangSwitch } from "@/components/FlowEditor";
import type { MessageNodeData } from "@/components/MessageNode";
import TelegramPreview from "@/components/TelegramPreview";
import { newId, type Flow, type Lang } from "@/lib/flow";
import type { Dict } from "@/lib/i18n";

// Лимиты Telegram: 4096 символов в сообщении; длинные подписи кнопок обрезаются клиентом.
const TEXT_LIMIT = 4096;
const BUTTON_LIMIT = 40;

interface Props {
  flow: Flow;
  node: { id: string; data: MessageNodeData };
  isStart: boolean;
  previewLang: Lang;
  onPreviewLang: (l: Lang) => void;
  onChange: (data: MessageNodeData) => void;
  onMakeStart: () => void;
  onDelete: () => void;
  onClose: () => void;
  dict: Dict;
}

export default function NodePanel({
  flow,
  node,
  isStart,
  previewLang,
  onPreviewLang,
  onChange,
  onMakeStart,
  onDelete,
  onClose,
  dict,
}: Props) {
  const { data } = node;
  const set = (patch: Partial<MessageNodeData>) => onChange({ ...data, ...patch });
  const setButton = (i: number, patch: Partial<MessageNodeData["buttons"][number]>) =>
    set({ buttons: data.buttons.map((b, j) => (j === i ? { ...b, ...patch } : b)) });

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{data.title}</h2>
        <button className="text-sm text-slate-500 hover:text-slate-800" onClick={onClose}>
          ✕ {dict["panel.close"]}
        </button>
      </div>

      <div>
        <label className="label">{dict["panel.title"]}</label>
        <input className="field" value={data.title} onChange={(e) => set({ title: e.target.value })} />
      </div>

      <div>
        <label className="label">{dict["panel.text"]}</label>
        <L10nField multiline maxLength={TEXT_LIMIT} value={data.text} onChange={(text) => set({ text })} />
      </div>

      <div>
        <label className="label">{dict["panel.buttons"]}</label>
        <div className="space-y-2">
          {data.buttons.map((b, i) => (
            <div key={b.id} className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-2">
              <L10nField maxLength={BUTTON_LIMIT} value={b.label} onChange={(label) => setButton(i, { label })} />
              <div className="flex items-center gap-2">
                <span className="w-11 shrink-0 text-[11px] font-semibold text-slate-500">🔗</span>
                <input
                  className="field"
                  type="url"
                  placeholder={dict["panel.url"]}
                  value={b.url ?? ""}
                  onChange={(e) => setButton(i, { url: e.target.value || undefined })}
                />
              </div>
              <button
                className="text-xs text-danger hover:underline"
                onClick={() => set({ buttons: data.buttons.filter((_, j) => j !== i) })}
              >
                {dict["panel.deleteButton"]}
              </button>
            </div>
          ))}
        </div>
        <button
          className="btn-ghost mt-2"
          disabled={data.buttons.length >= 12}
          onClick={() => set({ buttons: [...data.buttons, { id: newId(), label: { kk: "", ru: "" } }] })}
        >
          ＋ {dict["panel.addButton"]}
        </button>
        <p className="mt-1.5 text-xs text-slate-500">{dict["panel.urlHint"]}</p>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="label !mb-0">{dict["panel.preview"]}</span>
          <LangSwitch value={previewLang} onChange={onPreviewLang} />
        </div>
        <TelegramPreview flow={flow} node={{ ...node, position: { x: 0, y: 0 } }} lang={previewLang} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        {isStart ? (
          <span className="text-sm text-amber-700">★ {dict["panel.isStart"]}</span>
        ) : (
          <>
            <button className="btn-ghost" onClick={onMakeStart}>
              ★ {dict["panel.makeStart"]}
            </button>
            <button className="btn-ghost !text-danger" onClick={onDelete}>
              {dict["panel.delete"]}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
