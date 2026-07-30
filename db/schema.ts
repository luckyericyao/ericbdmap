import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const intelligenceRecords = sqliteTable(
  "intelligence_records",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    type: text("type", {
      enum: ["Intelligence", "Contact", "Action"],
    }).notNull(),
    title: text("title").notNull(),
    note: text("note").notNull(),
    evidence: text("evidence", {
      enum: ["A", "B", "C", "D"],
    })
      .notNull()
      .default("C"),
    source: text("source", {
      enum: ["Official", "BD Scholar", "Eric note"],
    })
      .notNull()
      .default("Eric note"),
    sourceUrl: text("source_url"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("intelligence_records_company_idx").on(table.companyId),
    index("intelligence_records_created_idx").on(table.createdAt),
  ],
);

export const structureVersions = sqliteTable(
  "structure_versions",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    versionLabel: text("version_label").notNull(),
    sourceTitle: text("source_title").notNull(),
    sourceUrl: text("source_url"),
    articleDate: text("article_date"),
    originalImageKey: text("original_image_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    originalMimeType: text("original_mime_type").notNull(),
    status: text("status", {
      enum: ["Original captured", "Replica in progress", "Verified snapshot"],
    })
      .notNull()
      .default("Original captured"),
    evidence: text("evidence", {
      enum: ["A", "B", "C", "D"],
    })
      .notNull()
      .default("C"),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("structure_versions_company_idx").on(table.companyId),
    index("structure_versions_created_idx").on(table.createdAt),
  ],
);

export const structureNodes = sqliteTable(
  "structure_nodes",
  {
    id: text("id").primaryKey(),
    versionId: text("version_id")
      .notNull()
      .references(() => structureVersions.id, { onDelete: "cascade" }),
    nodeType: text("node_type", {
      enum: ["Company", "Department", "Team", "Person", "Region", "Role"],
    }).notNull(),
    label: text("label").notNull(),
    role: text("role"),
    personName: text("person_name"),
    region: text("region"),
    positionX: integer("position_x").notNull(),
    positionY: integer("position_y").notNull(),
    width: integer("width").notNull().default(220),
    height: integer("height").notNull().default(96),
    evidence: text("evidence", {
      enum: ["A", "B", "C", "D"],
    })
      .notNull()
      .default("C"),
    verificationStatus: text("verification_status", {
      enum: ["Current", "Changed", "Unverified", "Historical"],
    })
      .notNull()
      .default("Unverified"),
    sourceUrl: text("source_url"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("structure_nodes_version_idx").on(table.versionId),
    index("structure_nodes_person_idx").on(table.personName),
  ],
);

export const structureEdges = sqliteTable(
  "structure_edges",
  {
    id: text("id").primaryKey(),
    versionId: text("version_id")
      .notNull()
      .references(() => structureVersions.id, { onDelete: "cascade" }),
    fromNodeId: text("from_node_id")
      .notNull()
      .references(() => structureNodes.id, { onDelete: "cascade" }),
    toNodeId: text("to_node_id")
      .notNull()
      .references(() => structureNodes.id, { onDelete: "cascade" }),
    relationship: text("relationship").notNull(),
    lineStyle: text("line_style", {
      enum: ["Solid", "Dashed", "Dotted"],
    })
      .notNull()
      .default("Solid"),
    arrowDirection: text("arrow_direction", {
      enum: ["Forward", "Backward", "Both", "None"],
    })
      .notNull()
      .default("Forward"),
    evidence: text("evidence", {
      enum: ["A", "B", "C", "D"],
    })
      .notNull()
      .default("C"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("structure_edges_version_idx").on(table.versionId),
    index("structure_edges_from_idx").on(table.fromNodeId),
    index("structure_edges_to_idx").on(table.toNodeId),
  ],
);

export type IntelligenceRecord = typeof intelligenceRecords.$inferSelect;
export type StructureVersion = typeof structureVersions.$inferSelect;
export type StructureNode = typeof structureNodes.$inferSelect;
export type StructureEdge = typeof structureEdges.$inferSelect;
