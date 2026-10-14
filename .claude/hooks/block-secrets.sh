#!/usr/bin/env bash
# PreToolUse hook: stops Claude Code from reading or printing secrets.
# Exit code 2 blocks the tool call and shows the message on stderr to Claude.

input=$(cat)

# Everything in the tool call that can point at a file or run a command.
target=$(jq -r '[.tool_input.file_path, .tool_input.path, .tool_input.glob, .tool_input.command]
  | map(select(. != null)) | join("\n")' <<<"$input")

block() {
  echo "Blocked by .claude/hooks/block-secrets.sh: $1 may contain secrets and must not be read by Claude." >&2
  exit 2
}

# .env, .env.local, path/.env ... but not environment.ts or process.env
if grep -Eq '(^|[^A-Za-z0-9_])\.env([^A-Za-z0-9_]|$)' <<<"$target"; then
  block ".env files"
fi

# .NET User Secrets (~/.microsoft/usersecrets/<id>/secrets.json)
if grep -Eiq 'usersecrets|secrets\.json' <<<"$target"; then
  block "User Secrets"
fi

if grep -Eq 'user-secrets[[:space:]]+list' <<<"$target"; then
  block "'dotnet user-secrets list'"
fi

exit 0
