<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git workflow

For every code change requested:

1. **Create a branch** before touching any file: `git checkout -b <short-slug>` (e.g. `feat/delete-prediction`, `fix/seed-grupos`). Never work directly on `main`.
2. **Implement** the change on that branch.
3. **Commit** all changes with a clear message.
4. **Push** the branch: `git push -u origin <branch>`.

Only merge or open a PR if the user explicitly asks for it.
