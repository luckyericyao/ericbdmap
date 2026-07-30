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

export type IntelligenceRecord = typeof intelligenceRecords.$inferSelect;
