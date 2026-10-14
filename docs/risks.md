# Risks & mitigations – GREJ

| # | Risk | Likelihood | Impact |
|---|---|---|---|
| 1 | Not enough time / scope creep | High | High |
| 2 | Illness or other unexpected time loss | Medium | High |
| 3 | The Stripe webhook is hard to get working | Medium | High |
| 4 | Free hosting limits | Medium | Medium |
| 5 | Deployment problems found late | Medium | High |
| 6 | Learning curve in new technology | High | Medium |
| 7 | AI-generated code I don't understand or with hidden bugs | Medium | Medium |
| 8 | Leaked secrets | Low | Medium |
| 9 | Two customers buy the last unique item at the same time | Low | Low |

## 1. Not enough time / scope creep

**Mitigation:** Must items first, planned to be done Wed 4 Nov. Checkpoints every week (see [sprint-plan.md](sprint-plan.md)). Feature freeze Fri 13 Nov. New ideas go to "future ideas" in [scope.md](scope.md), not into the current sprint.  
**Plan B:** drop Should items in the cut order. The MVP is always delivered.

## 2. Illness or other unexpected time loss

**Mitigation:** the MVP is planned two weeks before the presentation, and the last days are buffer.  
**Plan B:** use the buffer and weekends; drop Should items in the cut order.

## 3. The Stripe webhook is hard to get working

**Mitigation:** Stripe is part of the first vertical slice (sprint 1), so problems show up early. The Stripe CLI forwards webhook events to localhost.
**Plan B:** test with events triggered from the Stripe CLI and the Stripe dashboard.

## 4. Free hosting limits

Render's free tier sleeps after inactivity (slow first request) and its file system is cleared on every deploy. Supabase's free tier pauses a project after about a week without database traffic.

**Mitigation:** the database and images are stored in Supabase, not on Render. Stripe retries webhooks that fail while the server wakes up (in test mode only a few times over some hours), and events can be resent from the Stripe dashboard. Open the deployed site a few minutes before the presentation, and keep the project active until it has been graded (early December).
**Plan B:** restore a paused project from the Supabase dashboard. Migrations and seed scripts mean the database can be recreated at any time.

## 5. Deployment problems found late (CORS, environment variables, secrets)

**Mitigation:** deploy in sprint 0, and test every feature in the deployed environment as part of the Definition of Done.
**Plan B:** fix the problem in a branch while the last working version stays deployed.

## 6. Learning curve (Angular, ASP.NET Core Identity/JWT, Stripe)

**Mitigation:** the most uncertain parts (deployment, Stripe) come first. Claude Chat and official documentation for learning.
**Plan B:** simplify the solution, e.g. a simpler authentication setup, and document it as a known limitation.

## 7. AI-generated code I don't understand or with hidden bugs

**Mitigation:** review Claude's plan in plan mode before any code is written, only accept code I understand, review every pull request, and write tests for the business rules.
**Plan B:** rewrite the part myself in smaller steps.

## 8. Leaked secrets (Stripe keys, database password)

**Mitigation:** User Secrets locally, environment variables in hosting, `.gitignore`, and a hook that stops Claude Code from reading secrets.
**Plan B:** rotate the keys immediately. Only Stripe test keys are used, so the impact is low.

## 9. Two customers buy the last unique item at the same time

**Mitigation:** stock is checked before checkout and decreased when the payment is confirmed.
**Plan B:** the stock goes below 0, which shows the admin that one of the orders must be cancelled and refunded in Stripe (see [constraints.md](constraints.md)).
