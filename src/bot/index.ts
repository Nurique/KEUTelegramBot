// Процесс Telegram-бота (long polling). Запуск: npm run bot
// Сценарий читается из БД на каждое обновление, поэтому изменения из админки
// применяются сразу, без перезапуска.
import { Bot, GrammyError, InlineKeyboard, type Context } from "grammy";
import { loadFlow, setUserLang, touchUser } from "../lib/db";
import { LANGS, type Lang } from "../lib/flow";
import { findNode, languagePrompt, renderNode, type RenderedMessage } from "./engine";

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN не задан. Добавьте его в .env");
  process.exit(1);
}

const bot = new Bot(token);

function toKeyboard(msg: RenderedMessage): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const row of msg.keyboard) {
    for (const b of row) {
      if (b.kind === "url") kb.url(b.label, b.url);
      else kb.text(b.label, b.data);
    }
    kb.row();
  }
  return kb;
}

async function send(ctx: Context, msg: RenderedMessage, edit = false) {
  const opts = { reply_markup: toKeyboard(msg) };
  if (edit && ctx.callbackQuery?.message) {
    try {
      await ctx.editMessageText(msg.text, opts);
      return;
    } catch {
      // Сообщение могло устареть или не измениться — отправим новое.
    }
  }
  await ctx.reply(msg.text, opts);
}

function userOf(ctx: Context) {
  return touchUser({
    chatId: ctx.chat!.id,
    firstName: ctx.from?.first_name,
    username: ctx.from?.username,
  });
}

async function showNode(ctx: Context, lang: Lang, nodeId: string, edit: boolean) {
  const flow = loadFlow();
  const node = findNode(flow, nodeId) ?? findNode(flow, flow.startNodeId) ?? flow.nodes[0];
  await send(ctx, renderNode(flow, node, lang), edit);
}

bot.command("start", async (ctx) => {
  const { lang } = userOf(ctx);
  const flow = loadFlow();
  if (!lang) return send(ctx, languagePrompt(flow));
  await showNode(ctx, lang, flow.startNodeId, false);
});

bot.command(["lang", "language", "til"], (ctx) => send(ctx, languagePrompt(loadFlow())));

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const { lang } = userOf(ctx);
  await ctx.answerCallbackQuery();

  if (data.startsWith("lang:")) {
    const next = data.slice(5) as Lang;
    if (!LANGS.includes(next)) return;
    setUserLang(ctx.chat!.id, next);
    return showNode(ctx, next, loadFlow().startNodeId, true);
  }
  if (!lang) return send(ctx, languagePrompt(loadFlow()), true);
  if (data.startsWith("n:")) return showNode(ctx, lang, data.slice(2), true);
});

bot.on("message", async (ctx) => {
  const { lang } = userOf(ctx);
  const flow = loadFlow();
  if (!lang) return send(ctx, languagePrompt(flow));
  await ctx.reply(flow.settings.fallback[lang]);
  await showNode(ctx, lang, flow.startNodeId, false);
});

bot.catch((err) => console.error("Ошибка бота:", err.error));

void (async () => {
  await bot.api.setMyCommands([
    { command: "start", description: "Бастау / Начать" },
    { command: "lang", description: "Тіл / Язык" },
  ]);
  try {
    await bot.start({ onStart: () => console.log("Бот запущен (long polling)") });
  } catch (err) {
    if (err instanceof GrammyError && err.error_code === 409) {
      console.error(
        "Telegram вернул 409: этот токен уже опрашивает другой экземпляр бота.\n" +
          "Остановите второй процесс (другой терминал, сервер или проект с тем же BOT_TOKEN)\n" +
          "или выпустите новый токен в @BotFather (/revoke).",
      );
      process.exit(1);
    }
    throw err;
  }
})();

// Корректная остановка, чтобы следующий запуск не конфликтовал с «висящим» getUpdates.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => void bot.stop());
}
