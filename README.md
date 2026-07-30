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
- **Private draft capture** — add intelligence, contacts, and actions locally in
  the browser while the shared backend is being prepared.

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

## Next data milestone

The current add-intelligence form stores private drafts in browser local
storage. The next product milestone is a shared authenticated backend with:

1. companies, teams, people, and reporting relationships;
2. evidence sources and verification history;
3. opportunities, interactions, next actions, and internal owners;
4. role-based access for private relationship notes;
5. import tooling for the BD Scholar tracker workbook.
