# Eric's BD Map

A living partnering-intelligence workspace for mapping multinational pharma
strategy, decision structures, relationship strength, active opportunities, and
the next action that advances a deal.

## First-version scope

- **Global Map** — compare MNC strategic fit, relationship state, evidence
  confidence, therapeutic focus, and modalities.
- **Company Workspace** — bring official facts, BD Scholar analysis, Eric's
  judgment, active routes, and next actions into one company view.
- **Structure** — inspect the path from enterprise strategy through Search &
  Evaluation, Transactions, Alliance Management, and regional partnering.
- **Engagement** — track opportunities by stage, owner, deadline, and next move.
- **Shared intelligence records** — add, edit, and delete intelligence,
  contacts, and actions across signed-in devices.
- **Resilient draft capture** — fall back to a temporary browser draft when the
  shared database is unavailable.

The eight seeded company profiles are product-shaping data reconstructed from
the initial research brief. Evidence labels are intentionally visible:

- **A** — verified from an official or primary source
- **B** — corroborated by more than one source
- **C** — working hypothesis that needs confirmation
- **D** — unverified lead

Do not treat the seed organization relationships or contact gaps as a finished
intelligence dataset. They are designed to make provenance and verification
status operational from the first version.

## Local development

Requires Node.js 22.13+ and pnpm 11.9.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Validation

```bash
pnpm lint
pnpm build
```

## Data architecture

User-created intelligence records are stored in Cloudflare D1 through
`/api/intelligence`. The production site is owner-only, while the record schema
keeps source and evidence confidence explicit. Browser storage is only used as
a temporary fallback when the shared workspace cannot be reached.

The next product milestone expands the shared data model to:

1. companies, teams, people, and reporting relationships;
2. source URLs and a full verification history;
3. opportunities, interactions, next actions, and internal owners;
4. role-level access for private relationship notes;
5. import tooling for the BD Scholar tracker workbook.
