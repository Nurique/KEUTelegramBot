#!/usr/bin/env bash
# PostToolUse: после правки словарей интерфейса проверяет, что в kk.json и ru.json одинаковые ключи.
path=$(jq -r '.tool_input.file_path // empty')
[[ "$path" == */src/locales/*.json ]] || exit 0
cd "$CLAUDE_PROJECT_DIR" && node scripts/check-i18n.mjs >&2 || exit 2
