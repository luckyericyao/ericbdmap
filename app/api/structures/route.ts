import { getD1 } from "../../../db";

export const dynamic = "force-dynamic";

type StructureVersionRow = {
  id: string;
  company_id: string;
  version_label: string;
  source_title: string;
  source_url: string | null;
  article_date: string | null;
  original_image_key: string;
  original_filename: string;
  original_mime_type: string;
  status: "Original captured" | "Replica in progress" | "Verified snapshot";
  evidence: "A" | "B" | "C" | "D";
  notes: string | null;
  created_at: number;
  verified_at: number | null;
  node_count?: number;
  edge_count?: number;
};

type StructureNodeRow = {
  id: string;
  version_id: string;
  node_type: string;
  label: string;
  role: string | null;
  person_name: string | null;
  region: string | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  evidence: "A" | "B" | "C" | "D";
  verification_status: string;
  source_url: string | null;
  created_at: number;
};

type StructureEdgeRow = {
  id: string;
  version_id: string;
  from_node_id: string;
  to_node_id: string;
  relationship: string;
  line_style: string;
  arrow_direction: string;
  evidence: "A" | "B" | "C" | "D";
  created_at: number;
};

function cleanId(value: string | null) {
  return value?.trim().slice(0, 100) ?? "";
}

function toVersion(row: StructureVersionRow) {
  return {
    id: row.id,
    companyId: row.company_id,
    versionLabel: row.version_label,
    sourceTitle: row.source_title,
    sourceUrl: row.source_url,
    articleDate: row.article_date,
    originalFilename: row.original_filename,
    originalMimeType: row.original_mime_type,
    status: row.status,
    evidence: row.evidence,
    notes: row.notes,
    createdAt: new Date(row.created_at).toISOString(),
    verifiedAt: row.verified_at
      ? new Date(row.verified_at).toISOString()
      : null,
    nodeCount: Number(row.node_count ?? 0),
    edgeCount: Number(row.edge_count ?? 0),
    imageUrl: `/api/structure-assets?key=${encodeURIComponent(row.original_image_key)}`,
  };
}

function toNode(row: StructureNodeRow) {
  return {
    id: row.id,
    versionId: row.version_id,
    nodeType: row.node_type,
    label: row.label,
    role: row.role,
    personName: row.person_name,
    region: row.region,
    position: { x: row.position_x, y: row.position_y },
    size: { width: row.width, height: row.height },
    evidence: row.evidence,
    verificationStatus: row.verification_status,
    sourceUrl: row.source_url,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function toEdge(row: StructureEdgeRow) {
  return {
    id: row.id,
    versionId: row.version_id,
    fromNodeId: row.from_node_id,
    toNodeId: row.to_node_id,
    relationship: row.relationship,
    lineStyle: row.line_style,
    arrowDirection: row.arrow_direction,
    evidence: row.evidence,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return Response.json(
    {
      error: message.includes("no such table")
        ? "The permanent structure archive is still being prepared."
        : "The structure archive is temporarily unavailable.",
    },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const versionId = cleanId(url.searchParams.get("versionId"));
    const companyId = cleanId(url.searchParams.get("companyId"));
    const d1 = await getD1();

    if (versionId) {
      const [versionResult, nodeResult, edgeResult] = await Promise.all([
        d1
          .prepare(
            `SELECT id, company_id, version_label, source_title, source_url, article_date,
                    original_image_key, original_filename, original_mime_type, status,
                    evidence, notes, created_at, verified_at
             FROM structure_versions
             WHERE id = ?
             LIMIT 1`,
          )
          .bind(versionId)
          .all<StructureVersionRow>(),
        d1
          .prepare(
            `SELECT id, version_id, node_type, label, role, person_name, region,
                    position_x, position_y, width, height, evidence,
                    verification_status, source_url, created_at
             FROM structure_nodes
             WHERE version_id = ?
             ORDER BY position_y ASC, position_x ASC`,
          )
          .bind(versionId)
          .all<StructureNodeRow>(),
        d1
          .prepare(
            `SELECT id, version_id, from_node_id, to_node_id, relationship,
                    line_style, arrow_direction, evidence, created_at
             FROM structure_edges
             WHERE version_id = ?
             ORDER BY created_at ASC`,
          )
          .bind(versionId)
          .all<StructureEdgeRow>(),
      ]);
      const version = versionResult.results[0];
      if (!version) {
        return Response.json({ error: "Structure version not found." }, { status: 404 });
      }

      return Response.json({
        version: toVersion(version),
        nodes: nodeResult.results.map(toNode),
        edges: edgeResult.results.map(toEdge),
      });
    }

    if (!companyId) {
      return Response.json(
        { error: "Company id is required." },
        { status: 400 },
      );
    }

    const result = await d1
      .prepare(
        `SELECT v.id, v.company_id, v.version_label, v.source_title, v.source_url,
                v.article_date, v.original_image_key, v.original_filename,
                v.original_mime_type, v.status, v.evidence, v.notes, v.created_at,
                v.verified_at,
                (SELECT COUNT(*) FROM structure_nodes n WHERE n.version_id = v.id) AS node_count,
                (SELECT COUNT(*) FROM structure_edges e WHERE e.version_id = v.id) AS edge_count
         FROM structure_versions v
         WHERE v.company_id = ?
         ORDER BY v.created_at DESC
         LIMIT 100`,
      )
      .bind(companyId)
      .all<StructureVersionRow>();

    return Response.json({ versions: result.results.map(toVersion) });
  } catch (error) {
    return errorResponse(error);
  }
}
