# GREJ

A webshop for art and handmade items, with a CMS for the admin. Built as a thesis project (examensarbete) in the web developer program, October–November 2026.

- **Shop:** https://grej-xi.vercel.app
- **API:** https://grej-api.onrender.com (Render's free tier sleeps, so the first request can take up to a minute)

Payments run in Stripe's test mode. No real money is charged and no parcels are sent.

## Stack

| Part | Technology | Hosting |
|---|---|---|
| Frontend | Angular 22, TypeScript, SCSS | Vercel |
| API | ASP.NET Core Web API on .NET 10, EF Core | Render (Docker) |
| Database and images | PostgreSQL and Storage | Supabase |
| Payments | Stripe Checkout (test mode) | Stripe |
| Email | Order confirmations through Resend | Resend |

## Folders

- `server/` – the .NET solution: `Grej.Domain`, `Grej.Application`, `Grej.Infrastructure`, `Grej.Api`, plus unit and integration tests
- `client/` – the Angular app
- `docs/` – scope, constraints, architecture, design, sprint plan and AI log

## Run it locally

### Prerequisites

- .NET 10 SDK
- Node.js 24 and npm
- A Supabase project (PostgreSQL + a public Storage bucket named `product-images`)
- A Stripe account in test mode and the Stripe CLI
- A Resend API key (optional; without it no order email is sent)

### 1. API settings

The API reads its secrets from .NET User Secrets, never from files in the repo. From `server/`:

```bash
cd server/Grej.Api
dotnet user-secrets set "ConnectionStrings:Grej" "<Supabase session pooler connection string>"
dotnet user-secrets set "Supabase:Url" "https://<your-project>.supabase.co"
dotnet user-secrets set "Supabase:SecretKey" "<Supabase secret key>"
dotnet user-secrets set "Jwt:SigningKey" "<random string, at least 32 characters>"
dotnet user-secrets set "Stripe:SecretKey" "<sk_test_…>"
dotnet user-secrets set "Stripe:WebhookSecret" "<whsec_… from stripe listen, see step 4>"
dotnet user-secrets set "Resend:ApiKey" "<re_…>"
dotnet user-secrets set "Admin:Email" "<admin email>"
dotnet user-secrets set "Admin:Password" "<admin password>"
```

`appsettings.Development.json` already points CORS and Stripe's return URLs at http://localhost:4200.

### 2. Database

From `server/`:

```bash
dotnet tool restore
dotnet ef database update --project Grej.Infrastructure --startup-project Grej.Api
dotnet run --project Grej.Api -- seed-admin   # creates the admin account from Admin:Email/Password
dotnet run --project Grej.Api -- reset-demo   # fills the shop with demo products and orders (asks for RESET)
```

`reset-demo` empties the shop's tables first, so only run it against a database you want to reset.

### 3. Start the API and the app

```bash
cd server && dotnet run --project Grej.Api     # http://localhost:5200, health check at /api/health
cd client && npm install && npm start          # http://localhost:4200
```

The admin logs in at http://localhost:4200/admin.

### 4. Stripe webhooks

Orders are marked as paid by Stripe's webhook. Forward it to the local API and put the printed `whsec_…` secret in `Stripe:WebhookSecret`:

```bash
stripe listen --forward-to http://localhost:5200/api/webhooks/stripe
```

Pay with Stripe's test card `4242 4242 4242 4242`, any future date and any CVC.

## Tests

```bash
cd server && dotnet test    # unit and integration tests, no database needed
cd client && npm test       # Angular tests (Vitest)
```

GitHub Actions builds and tests both on every pull request (`.github/workflows/ci.yml`).

## Deployment

Both parts deploy automatically when `main` changes. Render builds `server/` with its Dockerfile, and Vercel builds `client/` to `dist/grej/browser`. In hosting the settings above are environment variables with `__` instead of `:`, e.g. `ConnectionStrings__Grej`, plus `Cors__AllowedOrigins__0` and `Frontend__Url` set to the Vercel URL.

## Documentation

The planning and design decisions are in [docs/](docs/): [scope](docs/scope.md), [constraints](docs/constraints.md), [ambiguity](docs/ambiguity.md), [architecture](docs/architecture.md), [design](docs/design.md), [sprint plan](docs/sprint-plan.md), [definition of done](docs/definition-of-done.md), [risks](docs/risks.md) and the [AI log](docs/ai-log.md).

## License

[MIT](LICENSE)
