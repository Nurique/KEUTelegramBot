"use client";

import { renderNode } from "@/bot/engine";
import type { Flow, FlowNode, Lang } from "@/lib/flow";

/** Показывает сообщение так, как его увидит пользователь в Telegram. Логика общая с ботом. */
export default function TelegramPreview({ flow, node, lang }: { flow: Flow; node: FlowNode; lang: Lang }) {
  const msg = renderNode(flow, node, lang);
  return (
    <div className="rounded-lg bg-tg p-3">
      <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm whitespace-pre-wrap shadow-sm">
        {msg.text}
      </div>
      <div className="mt-1 max-w-[90%] space-y-1">
        {msg.keyboard.map((row, i) => (
          <div key={i} className="flex gap-1">
            {row.map((b, j) => (
              <div
                key={j}
                className="flex-1 truncate rounded-md bg-white/60 px-2 py-1.5 text-center text-xs font-medium text-sky-800 backdrop-blur"
              >
                {b.label}
                {b.kind === "url" && " ↗"}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
