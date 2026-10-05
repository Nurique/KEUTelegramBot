// Чистая логика: что показать пользователю. Без grammY и БД — легко тестировать
// и переиспользовать для предпросмотра в админке.
import type { Flow, FlowNode, Lang } from "../lib/flow";

export type RenderedButton =
  | { kind: "url"; label: string; url: string }
  | { kind: "callback"; label: string; data: string };

export interface RenderedMessage {
  text: string;
  keyboard: RenderedButton[][];
}

/** callback_data: "n:<nodeId>" — перейти к узлу, "lang:<kk|ru>" — сменить язык. */
export const cb = {
  node: (nodeId: string) => `n:${nodeId}`,
  lang: (lang: Lang) => `lang:${lang}`,
};

export function languagePrompt(flow: Flow): RenderedMessage {
  return {
    text: flow.settings.chooseLanguage,
    keyboard: [
      [
        { kind: "callback", label: "🇰🇿 Қазақша", data: cb.lang("kk") },
        { kind: "callback", label: "🇷🇺 Русский", data: cb.lang("ru") },
      ],
    ],
  };
}

export function findNode(flow: Flow, nodeId: string): FlowNode | undefined {
  return flow.nodes.find((n) => n.id === nodeId);
}

export function renderNode(flow: Flow, node: FlowNode, lang: Lang): RenderedMessage {
  const keyboard: RenderedButton[][] = [];
  for (const b of node.data.buttons) {
    const label = b.label[lang] || b.label.ru || b.label.kk;
    if (b.url) {
      keyboard.push([{ kind: "url", label, url: b.url }]);
      continue;
    }
    const edge = flow.edges.find((e) => e.source === node.id && e.sourceHandle === b.id);
    // Кнопку без связи не показываем, чтобы пользователь не нажимал «в никуда».
    if (edge && findNode(flow, edge.target)) {
      keyboard.push([{ kind: "callback", label, data: cb.node(edge.target) }]);
    }
  }
  if (node.id !== flow.startNodeId) {
    keyboard.push([
      { kind: "callback", label: flow.settings.menuButton[lang], data: cb.node(flow.startNodeId) },
    ]);
  }
  return { text: node.data.text[lang] || node.data.text.ru || "…", keyboard };
}
