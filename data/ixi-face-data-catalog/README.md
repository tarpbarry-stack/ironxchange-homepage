# IXI FACE DATA CATALOG

Status: **FOUNDATION / REPOSITORY-DERIVED V1**

This directory is the authoritative, versioned catalog of data and capabilities that an IXI Face App may consume.

## Purpose

IXI Face Apps must never invent business truth, infer semantics from customer labels, calculate financial truth independently of IXI TRAN$ACT / the Financial Engine, or bypass effective permissions.

The catalog exists so four clients can build against the same contract:

1. IXI system-built Face Apps.
2. Customer Face Studio.
3. Chat/AI Face Compiler.
4. Future API/integration clients.

All four produce or install Face Apps against the same approved data capabilities.

## Core doctrine

- Customer nomenclature is presentation truth.
- Stable field IDs and semantic roles are machine truth.
- Object type names do not create business rules.
- Capabilities describe what an object can do.
- Effective permissions decide what the current actor may see or do.
- Explicit denial wins.
- Face 1 remains the primary bounded Object Card.
- Face 2+ are application Faces.
- A Face is the app module exposed in the object console.
- IXI TRAN$ACT is one universal transactional module, not a family of Face Apps.
- Face Apps may read approved TRAN$ACT / Financial Engine projections.
- Face Apps do not post, mutate, recalculate, or independently own financial truth.
- `$ TRAN$ACT` is the action surface for transactional work.
- Marketplace remains outside the universal TRAN$ACT rule.

## Catalog structure

- `index.json` — machine-readable top-level source/capability registry.
- `SYSTEM-CAPABILITY-INVENTORY.md` — human-readable repository inventory and source map.
- `sources/aos.json` — AOS object/field/relationship/container capabilities.
- `sources/transact.json` — TRAN$ACT actions and approved/available read-side projections.
- `sources/platform.json` — Passport, media, lineage, object-system, console and other platform capabilities.
- `permissions/permissions.json` — current permission mechanisms plus required Face Library policy model.
- `face-apps/registry.json` — Face App registry seed and existing Face surfaces found in the repository.
- `GAP-REPORT.md` — what is Face-safe now, what needs an adapter/projection/policy, and what must not be exposed directly.

## Classification

Every catalog capability must use one of these exposure states:

- `face-safe-now` — there is already a stable read-side contract suitable for Face consumption.
- `face-safe-with-policy` — read shape exists, but Face-level authorization/policy must be formalized.
- `needs-adapter` — source exists but needs a stable Face-facing adapter.
- `needs-projection` — source exists, but a derived/read-side projection must be owned by the source system.
- `action-only` — available through the operating/transaction system but should not be read or mutated directly by a Face.
- `internal-do-not-expose` — implementation detail, command infrastructure, credentials, raw server envelopes, or another unsafe source.

## Runtime rule for Chat-built Faces

Chat/AI never receives unrestricted database access and never generates executable customer React as the persistence model.

The intended flow is:

`authorized user -> Face Data Manifest -> constrained Face App definition -> validator -> permission check -> preview -> company Face Library -> publish/assign -> existing AOS Face Runtime`

A future per-user manifest must combine:

`IXI system catalog + customer object definitions + customer fields + customer relationships + TRAN$ACT projections + effective permissions`.

Only that authorized manifest should be exposed to a Face compiler.

## Maintenance

This V1 is derived from current repository contracts. Where the source code already provides a registry or canonical read adapter, that source remains authoritative and this catalog should eventually be generated/audited against it rather than manually duplicated.
