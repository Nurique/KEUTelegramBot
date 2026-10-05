#!/usr/bin/env bash
# PreToolUse: запрещает Claude читать и править .env* (там BOT_TOKEN и пароли).
# .env.example разрешён — в нём только шаблон без секретов.
path=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
name=$(basename -- "$path")
if [[ "$name" == .env* && "$name" != ".env.example" ]]; then
  echo "Доступ к $name запрещён хуком: файл содержит секреты бота. Меняйте его вручную." >&2
  exit 2
fi
exit 0
