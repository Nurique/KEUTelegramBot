@AGENTS.md

# KEU Bot — конструктор Telegram-бота

Админка для визуальной настройки Telegram-бота Карагандинского университета Казпотребсоюза.
Два процесса используют один файл SQLite:

- **Админка** — Next.js 16 (App Router), `npm run dev`. Визуальный редактор сценария на `@xyflow/react`.
- **Бот** — grammY, long polling, `npm run bot`. Читает сценарий из БД на каждое обновление, поэтому
  изменения из админки применяются без перезапуска.

## Команды

- `npm run dev` / `npm run build` — админка
- `npm run bot` — бот (нужен `BOT_TOKEN` в `.env`)
- `npm run typecheck`, `npm run lint`, `npm run i18n:check` — запускать перед завершением задачи

## Архитектура

- `src/lib/flow.ts` — zod-схема сценария (`Flow`: узлы, связи, общие настройки), `validateFlow`, сценарий по умолчанию.
  Это единственный источник правды о формате данных.
- `src/lib/db.ts` — `node:sqlite` (встроен в Node ≥ 22.5; Prisma намеренно не используем). Таблицы `flow` (одна строка с JSON) и `bot_users`.
- `src/bot/engine.ts` — чистые функции рендера сообщения/клавиатуры. Используются и ботом, и предпросмотром в админке (`TelegramPreview`).
- `src/bot/index.ts` — обработчики grammY. callback_data: `n:<nodeId>` (переход), `lang:<kk|ru>` (язык). Лимит Telegram — 64 байта.
- `src/components/FlowEditor.tsx` — состояние редактора; `MessageNode` — узел на схеме, у каждой кнопки свой source-handle (`sourceHandle` = id кнопки).
- `src/proxy.ts` + `src/lib/auth.ts` — вход по `ADMIN_PASSWORD`, cookie с HMAC (`SESSION_SECRET`). В Next 16 `middleware` переименован в `proxy`.
- `src/app/actions.ts` — server actions; каждая мутация обязана вызывать `requireAdmin()`.

## Правила

- **Двуязычие обязательно.** Любой текст бота — `L10n` `{ kk, ru }` внутри сценария. Любой текст UI — ключ в
  `src/locales/kk.json` **и** `src/locales/ru.json` (хук и `npm run i18n:check` проверяют паритет).
  Казахский — язык по умолчанию. Используйте корректные казахские буквы (ә, ғ, қ, ң, ө, ұ, ү, һ, і), а не латиницу или похожие кириллические.
- Файлы в `src/lib/flow.ts`, `src/lib/db.ts`, `src/bot/*` импортируются процессом бота через `tsx` —
  только относительные импорты, без алиаса `@/`.
- Сообщения бота отправляются без `parse_mode` (обычный текст), чтобы пользовательский ввод из админки не ломал разметку.
  Если добавляете HTML/Markdown — экранируйте.
- Меняя формат `Flow`, сохраняйте совместимость: `loadFlow()` откатывается к `defaultFlow`, если JSON не проходит схему.
- `.env*` (кроме `.env.example`) закрыты хуком — секреты меняет только человек.
