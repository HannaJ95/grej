# Definition of Done – GREJ

## A feature is done when

- It works end to end in the **deployed** environment, not only locally.
- It follows the rules in [constraints.md](constraints.md). Permissions and validation are enforced in the API, not only in the UI.
- Its business rules are covered by automated tests:
  - unit tests for rules, e.g. allowed order and payment status transitions, price calculation
  - integration tests for checkout and the Stripe webhook
- Build and tests pass in CI before it is merged to `main`.
- It is merged through a pull request that I have reviewed. This includes all AI-generated code, which I must be able to explain.
- No secrets are in the code or the repo.
- UI parts use semantic HTML, have alt texts on images and are usable at mobile width. (Full responsive and accessibility review is a Should in sprint 4; doing the basics continuously is cheaper than fixing them afterwards.)

## A sprint is done when

- Its goal in [sprint-plan.md](sprint-plan.md) is reached, or the reason it was not is written down.
- Unfinished items are moved to a later sprint or dropped according to the cut order.

## The project is done when

- All Must items in [scope.md](scope.md) are done according to the criteria above.
- The full flow works in production: a customer buys several products with a Stripe test card, the webhook marks the payment as paid, and the admin sees the order and marks it as shipped.
- The README describes how to run the project locally (including the Stripe CLI for webhooks).
- The planning documents match what was built, and known limitations are documented.
