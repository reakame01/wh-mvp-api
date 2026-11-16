## Summary

<!-- 1–3 bullets: what changed and why -->

-

## Type of change

- [ ] feat — new feature
- [ ] fix — bug fix
- [ ] refactor — no behavior change
- [ ] test — tests only
- [ ] docs — documentation only
- [ ] chore — tooling, CI, deps
- [ ] ci — CI/CD only

## Related

<!-- Issue / ADR / discussion link, or "N/A" -->

-

## Checklist

- [ ] Follows pragmatic CA boundaries (`domain` / `application` / `infrastructure` / `presentation`)
- [ ] No live secrets / `.env` values committed
- [ ] Lint passes (`npm run lint`)
- [ ] Unit tests pass (`npm test`); added/updated tests where needed
- [ ] Migrations included if schema changed (`prisma/migrations`)
- [ ] OpenAPI / API docs updated if endpoints changed (when applicable)
- [ ] Audit log considered for state-changing behavior (when applicable)
- [ ] Invariants still hold (append-only ledger, no negative stock, no oversell) — if stock paths touched
- [ ] README or ADR updated if architecture / behavior changed

## Test plan

<!-- How reviewers can verify -->

- [ ]
- [ ]

## Notes / risks

<!-- Edge cases, rollout, follow-ups -->

-
