# GREJ

A webshop for art and handmade items with an admin CMS. Built as my examensarbete (thesis project), 12 Oct – 20 Nov 2026.

- **Stack:** Angular (Vercel) · ASP.NET Core Web API on .NET 10 (Render, Docker) · PostgreSQL and image storage (Supabase) · Stripe Checkout in test mode
- **Folders:** `server/` (.NET solution), `client/` (Angular), `docs/` (planning)

## Docs – read the relevant ones before planning a feature

- [scope.md](docs/scope.md) – what is built (MoSCoW)
- [constraints.md](docs/constraints.md) – rules the code must follow
- [ambiguity.md](docs/ambiguity.md) – decisions on unclear requirements
- [architecture.md](docs/architecture.md) – modules, layers and data model
- [sprint-plan.md](docs/sprint-plan.md) – sprints, checkpoints and cut order
- [definition-of-done.md](docs/definition-of-done.md)

## How we work

- I make all commits and pushes myself. Never run `git commit` or `git push`. Tell me when it is a good time to commit and suggest a short commit message.
- Use plan mode before each feature, and work in small steps.
- Follow constraints.md. If the code and the docs disagree, ask before changing either.
- Explain the code you write so that I can understand it. I must be able to explain all AI-generated code.
- Keep answers short: one decision at a time, with a recommended default.
- Code, comments and docs are in English. All text in the UI is in Swedish.
- Never read or print secrets. They live in User Secrets locally and in environment variables in hosting. A hook in `.claude/hooks/` blocks access to them.
- At the end of a work session, suggest a few lines for [ai-log.md](docs/ai-log.md).

## Commands

Run from `server/`:

- `dotnet build` – build the solution
- `dotnet test` – run unit and integration tests
- `dotnet run --project Grej.Api` – start the API (health checks: `GET /api/health` and `GET /api/health/database`)
- `dotnet tool restore` – install the local `dotnet-ef` tool (once per machine)
- `dotnet ef migrations add <Name> --project Grej.Infrastructure --startup-project Grej.Api --output-dir Persistence/Migrations` – create a migration
- `dotnet ef database update --project Grej.Infrastructure --startup-project Grej.Api` – apply migrations to the database in User Secrets

The connection string is `ConnectionStrings:Grej` in User Secrets locally (Supabase session pooler) and `ConnectionStrings__Grej` as an environment variable in hosting.

Run from `client/` (Angular; `client/CLAUDE.md` has the Angular team's best practices):

- `npm start` – start the app on http://localhost:4200 (calls the API on http://localhost:5200)
- `npm test` – run the tests (Vitest)
- `npm run build` – production build to `client/dist/`
