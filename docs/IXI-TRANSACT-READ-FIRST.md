# IXI TRAN$ACT — READ FIRST

**Future chats / engineers: start here before changing IXI TRAN$ACT financial code.**

Read these files in order:

1. **System doctrine and complete financial handoff**  
   `docs/IXI-TRANSACT-FINANCIAL-SYSTEM-DOSSIER.md`

2. **What is built vs what remains incomplete / integration-dependent**  
   `docs/IXI-TRANSACT-FINANCIAL-SYSTEM-COMPLETENESS-AUDIT.md`

3. **Full-size IXI TRAN$ACT accounting dashboard product/architecture dossier**  
   `docs/IXI-TRANSACT-ACCOUNTING-DASHBOARD-DOSSIER.md`

4. **Full-size dashboard engineering implementation specification**  
   `docs/IXI-TRANSACT-ACCOUNTING-DASHBOARD-ENGINEERING-BUILD-SPEC.md`

5. **Full-size dashboard functionality / UX / workflow specification**  
   `docs/IXI-TRANSACT-ACCOUNTING-DASHBOARD-FUNCTIONALITY-SPEC.md`

---

## Core doctrine

```text
AOS / Passport = business context and relationships
TRAN$ACT = operational/commercial truth
AWS IXI Financial = canonical financial truth
General Ledger = accounting truth
Financial Reporting = read-only accounting projection
Full-size IXI TRAN$ACT Dashboard = office command center over the same records/engines
```

Do not build a parallel frontend financial ledger.
Do not rewrite card-domain equations separately in the dashboard.
Do not bypass IXI Financial commands or authority controls.
Do not treat Vercel-green alone as proof of end-to-end AWS completion.
