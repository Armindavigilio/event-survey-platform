# Event Survey Platform

Reusable event-survey platform for physical events, designed around QR entry, anonymous participation, offline resilience, idempotent submission handling, and later reporting/export workflows.

The project is built with **Next.js 16**, **React 19**, **TypeScript**, and **pnpm**.

## Architecture

The project follows a **modular monolith** organized by business capability. Modules use **Ports & Adapters / Clean Architecture principles where they add real value**, while avoiding ceremonial layers.

Core rules:

- business and application logic must not depend on Next.js, React, Payload, Prisma, PostgreSQL, browser APIs, or transport details;
- infrastructure implements contracts owned by the application/core;
- `src/app` is the delivery and composition layer, not the home of business logic;
- modules expose controlled public APIs rather than encouraging deep imports;
- persistence and framework choices must follow functional requirements instead of shaping the domain model;
- new folders, abstractions, and layers are introduced only when a real responsibility requires them.

The governing architectural source is:

- [`docs/architecture/MASTER_ARCHITECTURE.md`](docs/architecture/MASTER_ARCHITECTURE.md)

Relevant ADRs:

- [`ADR-001 — Modular Monolith`](docs/architecture/decisions/ADR-001-modular-monolith.md)
- [`ADR-002 — Dependency Direction / Ports & Adapters`](docs/architecture/decisions/ADR-002-dependency-direction-ports-and-adapters.md)

## Survey module

The `survey` module currently provides the complete in-memory participation lifecycle.

Current behavior includes:

- one active survey per event in the initial scope;
- anonymous responses with no directly identifying personal data;
- a constrained, data-driven Likert survey model;
- required respondent category and required survey items;
- editable drafts before final submission;
- immutable finalized submissions;
- client-generated `submissionId` values;
- authoritative server-side validation;
- idempotent submission acceptance;
- offline submission queueing;
- support for multiple participants using the same device;
- synchronization states `PENDING`, `SYNCED`, and `REJECTED`;
- configurable `opensAt`, `closesAt`, and `acceptSubmissionsUntil`;
- separate `Survey` and `SurveySubmission` aggregate roots.

The implemented application use cases are:

```text
GetActiveSurvey
        ↓
StartSurveyParticipation
        ↓
SubmitSurvey
        ↓
AcceptSurveySubmission
        ↓
SynchronizePendingSubmissions
```

A finalized submission is stored locally as `PENDING` before its first transmission attempt. Successful or already-accepted submissions become `SYNCED`; retryable transport failures remain `PENDING`; terminal server rejections become `REJECTED`.

The detailed functional and technical specification is maintained in:

- [`docs/modules/survey/SURVEY_TECHNICAL_SPEC.md`](docs/modules/survey/SURVEY_TECHNICAL_SPEC.md)

### Current verification status

The survey core is currently verified **in memory**:

- 13 automated tests passing;
- ESLint passing;
- TypeScript/build passing;
- formatting reviewed.

Persistence adapters, browser/HTTP adapters, and Next.js web integration are the next implementation phase.

### Known offline timing limitation

During the `SYNC_ONLY` window, the authoritative server can decide whether it is still allowed to receive pending submissions, but it cannot yet prove that an offline submission was actually finalized before `closesAt`.

Client timestamps are therefore not treated as authoritative.

## Project structure

Current top-level direction:

```text
src/
├── app/                 # Next.js delivery and composition layer
└── modules/
    └── survey/
        ├── domain/
        ├── application/
        ├── ports/
        └── index.ts     # controlled public API when finalized
```

Adapter and presentation folders are added only when concrete implementations exist.

## Development

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

Run linting:

```bash
pnpm lint
```

Run a production build:

```bash
pnpm build
```

The project uses **pnpm exclusively**.

## Development conventions

Project-maintained source files begin with a short header containing:

1. the relative file path;
2. the file responsibility;
3. an optional architectural invariant when useful.

Example:

```ts
// src/modules/survey/application/submit-survey/submit-survey.ts
// Finalizes a valid draft, persists it locally, and attempts authoritative submission.
```

Architectural changes must be justified against `MASTER_ARCHITECTURE.md`. Significant cross-cutting decisions should be recorded through ADRs rather than being introduced silently in implementation code.

## Current phase

The current milestone is:

```text
functional specification
        ↓
domain model
        ↓
application use cases
        ↓
ports
        ↓
in-memory verification
        ↓
adapters and web integration   ← next
```

The next step is to finalize the `survey` module public API and then implement concrete adapters without coupling the core to their technologies.
