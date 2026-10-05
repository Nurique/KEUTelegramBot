// Модель сценария бота. Общая для админки (Next.js) и процесса бота (tsx),
// поэтому здесь только относительные импорты — без алиаса "@/".
import { z } from "zod";

export const LANGS = ["kk", "ru"] as const;
export type Lang = (typeof LANGS)[number];

const l10n = z.object({ kk: z.string(), ru: z.string() });
export type L10n = z.infer<typeof l10n>;

const button = z.object({
  id: z.string().min(1).max(16),
  label: l10n,
  // Если задан url — кнопка открывает ссылку, иначе ведёт по связи (edge) на другой узел.
  url: z.url({ protocol: /^https?$/ }).optional(),
});
export type FlowButton = z.infer<typeof button>;

const node = z.object({
  id: z.string().min(1).max(16),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.object({
    title: z.string(),
    text: l10n,
    buttons: z.array(button).max(12),
  }),
});
export type FlowNode = z.infer<typeof node>;

const edge = z.object({
  id: z.string(),
  source: z.string(),
  sourceHandle: z.string(), // id кнопки
  target: z.string(),
});
export type FlowEdge = z.infer<typeof edge>;

export const flowSchema = z.object({
  startNodeId: z.string(),
  settings: z.object({
    // Приветствие до выбора языка показывается сразу на двух языках.
    chooseLanguage: z.string(),
    menuButton: l10n,
    fallback: l10n,
  }),
  nodes: z.array(node).min(1),
  edges: z.array(edge),
});
export type Flow = z.infer<typeof flowSchema>;

/** Максимум байт в callback_data у Telegram. */
export const CALLBACK_DATA_LIMIT = 64;

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Список проблем сценария: пустые переводы, битые ссылки. Используется в UI для подсветки. */
export function validateFlow(flow: Flow): { nodeId?: string; code: string; lang?: Lang }[] {
  const issues: { nodeId?: string; code: string; lang?: Lang }[] = [];
  const ids = new Set(flow.nodes.map((n) => n.id));
  if (!ids.has(flow.startNodeId)) issues.push({ code: "noStart" });
  for (const n of flow.nodes) {
    for (const lang of LANGS) {
      if (!n.data.text[lang].trim()) issues.push({ nodeId: n.id, code: "emptyText", lang });
      for (const b of n.data.buttons) {
        if (!b.label[lang].trim()) issues.push({ nodeId: n.id, code: "emptyButton", lang });
      }
    }
    for (const b of n.data.buttons) {
      if (b.url) {
        if (!/^https?:\/\/\S+\.\S+/.test(b.url)) issues.push({ nodeId: n.id, code: "badUrl" });
        continue;
      }
      if (!flow.edges.some((e) => e.source === n.id && e.sourceHandle === b.id)) {
        issues.push({ nodeId: n.id, code: "danglingButton" });
      }
    }
  }
  return issues;
}

export const defaultFlow: Flow = {
  startNodeId: "main",
  settings: {
    chooseLanguage:
      "Қош келдіңіз! Тілді таңдаңыз.\nДобро пожаловать! Выберите язык.",
    menuButton: { kk: "🏠 Басты мәзір", ru: "🏠 Главное меню" },
    fallback: {
      kk: "Төмендегі батырмаларды пайдаланыңыз.",
      ru: "Пожалуйста, используйте кнопки ниже.",
    },
  },
  nodes: [
    {
      id: "main",
      position: { x: 0, y: 0 },
      data: {
        title: "Главное меню",
        text: {
          kk: "Қазтұтынуодағы Қарағанды университетінің боты. Не қызықтырады?",
          ru: "Бот Карагандинского университета Казпотребсоюза. Что вас интересует?",
        },
        buttons: [
          { id: "b_adm", label: { kk: "🎓 Талапкерге", ru: "🎓 Абитуриенту" } },
          { id: "b_cnt", label: { kk: "📞 Байланыс", ru: "📞 Контакты" } },
          {
            id: "b_web",
            label: { kk: "🌐 Сайт", ru: "🌐 Сайт" },
            url: "https://keu.kz",
          },
        ],
      },
    },
    {
      id: "admission",
      position: { x: -220, y: 260 },
      data: {
        title: "Абитуриенту",
        text: {
          kk: "Қабылдау комиссиясы туралы ақпарат осында болады.",
          ru: "Здесь будет информация о приёмной комиссии.",
        },
        buttons: [],
      },
    },
    {
      id: "contacts",
      position: { x: 220, y: 260 },
      data: {
        title: "Контакты",
        text: {
          kk: "Мекенжай мен телефондарды осында көрсетіңіз.",
          ru: "Укажите здесь адрес и телефоны.",
        },
        buttons: [],
      },
    },
  ],
  edges: [
    { id: "e1", source: "main", sourceHandle: "b_adm", target: "admission" },
    { id: "e2", source: "main", sourceHandle: "b_cnt", target: "contacts" },
  ],
};
