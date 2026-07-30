import { getD1 } from "../../../db";

export const dynamic = "force-dynamic";

const recordTypes = ["Intelligence", "Contact", "Action"] as const;
const evidenceLevels = ["A", "B", "C", "D"] as const;
const sourceTypes = ["Official", "BD Scholar", "Eric note"] as const;

type RecordType = (typeof recordTypes)[number];
type EvidenceLevel = (typeof evidenceLevels)[number];
type SourceType = (typeof sourceTypes)[number];

type IntelligenceRow = {
  id: string;
  company_id: string;
  type: RecordType;
  title: string;
  note: string;
  evidence: EvidenceLevel;
  source: SourceType;
  source_url: string | null;
  created_at: number;
  updated_at: number;
};

function isOneOf<T extends string>(
  value: unknown,
  options: readonly T[],
): value is T {
  return typeof value === "string" && options.includes(value as T);
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function toRecord(row: IntelligenceRow) {
  return {
    id: row.id,
    companyId: row.company_id,
    type: row.type,
    title: row.title,
    note: row.note,
    evidence: row.evidence,
    source: row.source,
    sourceUrl: row.source_url,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const isMissingTable = message.includes("no such table");

  return Response.json(
    {
      error: isMissingTable
        ? "The shared intelligence database is still being prepared."
        : "The shared intelligence workspace is temporarily unavailable.",
    },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  try {
    const companyId = cleanText(
      new URL(request.url).searchParams.get("companyId"),
      80,
    );
    const d1 = getD1();
    const statement = companyId
      ? d1
          .prepare(
            `SELECT id, company_id, type, title, note, evidence, source, source_url, created_at, updated_at
             FROM intelligence_records
             WHERE company_id = ?
             ORDER BY updated_at DESC
             LIMIT 250`,
          )
          .bind(companyId)
      : d1.prepare(
          `SELECT id, company_id, type, title, note, evidence, source, source_url, created_at, updated_at
           FROM intelligence_records
           ORDER BY updated_at DESC
           LIMIT 500`,
        );
    const result = await statement.all<IntelligenceRow>();

    return Response.json({ records: result.results.map(toRecord) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const companyId = cleanText(payload.companyId, 80);
    const title = cleanText(payload.title, 160);
    const note = cleanText(payload.note, 5000);
    const type = isOneOf(payload.type, recordTypes)
      ? payload.type
      : "Intelligence";
    const evidence = isOneOf(payload.evidence, evidenceLevels)
      ? payload.evidence
      : "C";
    const source = isOneOf(payload.source, sourceTypes)
      ? payload.source
      : "Eric note";
    const sourceUrl = cleanText(payload.sourceUrl, 2000);

    if (!companyId || !title || !note) {
      return Response.json(
        { error: "Company, title, and note are required." },
        { status: 400 },
      );
    }
    if (
      sourceUrl &&
      !sourceUrl.startsWith("https://") &&
      !sourceUrl.startsWith("http://")
    ) {
      return Response.json(
        { error: "Source URL must start with http:// or https://." },
        { status: 400 },
      );
    }

    const id = `record-${crypto.randomUUID()}`;
    const now = Date.now();
    const d1 = getD1();
    await d1
      .prepare(
        `INSERT INTO intelligence_records
          (id, company_id, type, title, note, evidence, source, source_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        companyId,
        type,
        title,
        note,
        evidence,
        source,
        sourceUrl || null,
        now,
        now,
      )
      .run();

    return Response.json(
      {
        record: toRecord({
          id,
          company_id: companyId,
          type,
          title,
          note,
          evidence,
          source,
          source_url: sourceUrl || null,
          created_at: now,
          updated_at: now,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const id = cleanText(payload.id, 100);
    const companyId = cleanText(payload.companyId, 80);
    const title = cleanText(payload.title, 160);
    const note = cleanText(payload.note, 5000);
    const type = isOneOf(payload.type, recordTypes)
      ? payload.type
      : "Intelligence";
    const evidence = isOneOf(payload.evidence, evidenceLevels)
      ? payload.evidence
      : "C";
    const source = isOneOf(payload.source, sourceTypes)
      ? payload.source
      : "Eric note";
    const sourceUrl = cleanText(payload.sourceUrl, 2000);

    if (!id || !companyId || !title || !note) {
      return Response.json(
        { error: "Record, company, title, and note are required." },
        { status: 400 },
      );
    }
    if (
      sourceUrl &&
      !sourceUrl.startsWith("https://") &&
      !sourceUrl.startsWith("http://")
    ) {
      return Response.json(
        { error: "Source URL must start with http:// or https://." },
        { status: 400 },
      );
    }

    const updatedAt = Date.now();
    const d1 = getD1();
    await d1
      .prepare(
        `UPDATE intelligence_records
         SET company_id = ?, type = ?, title = ?, note = ?, evidence = ?, source = ?, source_url = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        companyId,
        type,
        title,
        note,
        evidence,
        source,
        sourceUrl || null,
        updatedAt,
        id,
      )
      .run();

    return Response.json({
      record: {
        id,
        companyId,
        type,
        title,
        note,
        evidence,
        source,
        sourceUrl: sourceUrl || null,
        updatedAt: new Date(updatedAt).toISOString(),
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const id = cleanText(new URL(request.url).searchParams.get("id"), 100);
    if (!id) {
      return Response.json(
        { error: "Record id is required." },
        { status: 400 },
      );
    }

    const d1 = getD1();
    await d1
      .prepare("DELETE FROM intelligence_records WHERE id = ?")
      .bind(id)
      .run();

    return Response.json({ deleted: id });
  } catch (error) {
    return toErrorResponse(error);
  }
}
