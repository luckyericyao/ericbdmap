# Eric's BD Map

A living partnering-intelligence workspace for mapping multinational pharma
strategy, decision structures, relationship strength, active opportunities, and
the next action that advances a deal.

## Current scope

- **Global Map** — compare MNC strategic fit, relationship state, evidence
  confidence, therapeutic focus, and modalities.
- **Company Workspace** — bring official facts, BD Scholar analysis, Eric's
  judgment, active routes, and next actions into one company view.
- **Structure Archive** — make the original BD Scholar diagram the source of
  truth, then keep its interactive replica and current validation as separate
  evidence layers.
- **Immutable source versions** — archive complete original PNG, JPEG, or WebP
  diagrams with their article title, URL, date, notes, and capture time.
- **Replica-ready data model** — preserve every node, relationship, original
  coordinate, box size, line style, arrow direction, and verification state.
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
intelligence dataset. The provisional canvas is deliberately labeled as a
working reconstruction until an original source file and its node-by-node
replica have been captured.

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
pnpm build:vercel
```

`pnpm build` produces the Cloudflare-compatible Sites deployment. Vercel uses
the native Next.js build declared in `vercel.json`; its deployment is a
secondary preview and intentionally has no access to the private D1/R2 data
bindings. Shared intelligence and original-diagram uploads remain available
only on the owner-only Sites deployment.

## Data architecture

Cloudflare D1 stores intelligence records plus structure versions, nodes, and
edges. Cloudflare R2 stores the original diagram files privately; the app
streams them through `/api/structure-assets` instead of exposing a public
bucket. A new upload appends an immutable version rather than overwriting
history.

The structure data model keeps the three layers separate:

1. **Original** — the complete author-created image and article metadata.
2. **Interactive replica** — nodes, reporting relationships, coordinates,
   dimensions, line styles, and arrows transcribed from that exact version.
3. **Current validation** — official confirmation, changes, unresolved claims,
   and the latest verification date.

User-created intelligence, contacts, and actions continue to use
`/api/intelligence`. Browser storage is only a temporary fallback when the
shared workspace cannot be reached.

The next product milestone is the node-and-edge transcription editor, followed
by tracker workbook import and role-level access for private relationship
notes.
