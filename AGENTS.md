<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# Event Survey Platform — Repository Rules

These rules govern all code and documentation created for this repository.

## 1. Source of architectural truth

Before making architectural or structural changes, read:

`docs/architecture/MASTER_ARCHITECTURE.md`

Significant architectural decisions must be documented as ADRs under:

`docs/architecture/decisions/`

If implementation convenience conflicts with the documented architecture, the architecture must be reviewed explicitly rather than silently bypassed.

## 2. Package manager

Use `pnpm` exclusively.

Do not create or commit:

- `package-lock.json`
- `yarn.lock`
- alternative package-manager metadata

The package-manager version declared in `package.json` is authoritative.

## 3. Architectural direction

The project follows this dependency direction:

```text
domain
  ↑
application
  ↑
presentation

ports
  ↑
adapters
```

Infrastructure implements application-owned contracts.

Technology must adapt to the application; application logic must not adapt to a specific infrastructure technology.

## 4. Domain rules

Code under a module's `domain` layer must not depend on:

- Next.js
- React
- Payload
- Prisma
- PostgreSQL-specific APIs
- Tailwind CSS
- browser APIs
- `window`
- `localStorage`
- HTTP request/response objects

Domain code must remain framework-independent.

## 5. Application rules

Application code may depend on domain concepts and ports.

Application code must not depend directly on:

- Prisma
- Payload
- PostgreSQL clients
- `NextRequest`
- `NextResponse`
- React
- browser storage APIs

Use cases express application behavior and depend on abstractions when infrastructure is required.

## 6. Adapter rules

Technology-specific integrations belong in adapters.

Examples include:

- Payload
- Prisma
- PostgreSQL
- browser storage
- external APIs
- file-generation libraries

External representations must be mapped into internal application/domain models before crossing an adapter boundary.

## 7. Presentation rules

Presentation code must not access persistence directly.

UI components must not receive technology-specific objects such as Payload documents or Prisma records when an application-specific model can be used instead.

## 8. Next.js `app` directory

`src/app` is the delivery and composition layer.

Route handlers should remain thin and be responsible primarily for:

1. receiving input;
2. translating it into application input;
3. invoking a use case;
4. translating the result into HTTP output.

Business rules must not live in route handlers.

## 9. Feature-first organization

Organize application code primarily by capability or feature, not globally by technical file type.

Do not create architectural folders merely to satisfy a template.

A folder should appear when a real responsibility exists for it.

## 10. Shared code

Do not use `shared`, `common`, `lib`, or `utils` as dumping grounds.

Code belongs in shared space only when its responsibility is genuinely cross-cutting and has no clearer domain owner.

## 11. CSS and visual-system boundaries

`src/app/globals.css` is the global CSS entry point.

Do not accumulate feature- or component-specific styles in `globals.css`.

Global design tokens and base styles should live in dedicated files when they are introduced.

Component-specific styles should remain colocated with the component or use the project's approved Tailwind conventions.

## 12. Code-file header convention

Every project-maintained source-code file must begin with a short header of no more than three lines.

The order is:

1. repository-relative path;
2. primary responsibility of the file;
3. optional architectural restriction or relevant invariant.

Examples:

```ts
// src/modules/survey/domain/SurveySubmission.ts
// Represents a complete survey submission and its domain invariants.
```

```tsx
// src/modules/gallery/presentation/GalleryGrid.tsx
// Renders the event image collection as the gallery grid.
```

A third line should only be used when it adds meaningful architectural information:

```ts
// src/modules/survey/adapters/cms/payload/PayloadSurveyProvider.ts
// Adapts Payload documents to the SurveyDefinitionProvider contract.
// Payload-specific types must not escape this adapter.
```

Do not add redundant comments that simply restate the syntax of the code.

Generated files, third-party files, build output, and files maintained automatically by tooling are exempt from this convention.

## 13. Security

Security is a design concern, not a final implementation phase.

Inputs crossing trust boundaries must be validated on the server.

Client-side validation exists for UX and never replaces server-side validation.

Secrets must not be committed to the repository.

## 14. Testing

Business rules and use cases should be testable without requiring real infrastructure.

Prefer ports and in-memory adapters when testing application behavior.

Infrastructure integrations should be covered separately by integration tests.

## 15. Architectural changes

Create or update an ADR when introducing a decision that materially affects:

- module boundaries;
- dependency direction;
- persistence strategy;
- CMS strategy;
- security model;
- public contracts;
- deployment model;
- cross-cutting infrastructure;
- major development conventions.

Do not create ADRs for ordinary implementation details.

## 16. Simplicity

Apply YAGNI.

Do not introduce:

- microservices without an operational reason;
- unnecessary abstraction layers;
- empty architectural folders;
- interfaces without a meaningful boundary;
- infrastructure that is not yet required.

Prefer the simplest implementation that preserves the documented boundaries.


## 17. React modularity and composition

Follow section 54 of `docs/architecture/MASTER_ARCHITECTURE.md`.

- Give each component a clear presentation responsibility and an intentional name.
- Keep feature components in their owning module; reserve shared UI for genuinely cross-cutting elements.
- Compose pages and layouts from meaningful pieces without fragmenting trivial markup.
- Use typed, explicit props and internal models; keep business rules outside React components and hooks.
- Keep interaction state close to its consumers; lift it only when sharing is necessary.
- Extract custom hooks for cohesive interaction behavior or real reuse, not as a default layer.
- Default to Server Components and place client boundaries where interaction requires them.
- Encapsulate visual libraries within presentation and respect public module APIs.
- Colocate component styles; use shared typography and design tokens through their semantic roles.
- Do not impose component line limits or add speculative abstractions or memoization.
- Review accessibility, responsive behavior, types, lint, and proportionate behavioral checks.

Modularity serves maintainability and readability; it does not by itself guarantee runtime performance.
