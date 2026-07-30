import { getD1, getStructureAssets } from "../../../db";

export const dynamic = "force-dynamic";

const allowedTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validHttpUrl(value: string) {
  return (
    !value || value.startsWith("https://") || value.startsWith("http://")
  );
}

function assetError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return Response.json(
    {
      error: message.includes("no such table")
        ? "The structure archive is still being prepared."
        : "The original diagram could not be stored right now.",
    },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get("key") ?? "";
    if (!key.startsWith("structures/") || key.includes("..")) {
      return Response.json({ error: "Invalid structure asset." }, { status: 400 });
    }

    const bucket = await getStructureAssets();
    const object = await bucket.get(key);
    if (!object) {
      return Response.json({ error: "Original diagram not found." }, { status: 404 });
    }

    return new Response(object.body, {
      headers: {
        "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
        "cache-control": "private, max-age=3600",
        etag: object.httpEtag,
        "content-length": String(object.size),
      },
    });
  } catch (error) {
    return assetError(error);
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const companyId = cleanText(form.get("companyId"), 80);
    const versionLabel = cleanText(form.get("versionLabel"), 100);
    const sourceTitle = cleanText(form.get("sourceTitle"), 180);
    const sourceUrl = cleanText(form.get("sourceUrl"), 2000);
    const articleDate = cleanText(form.get("articleDate"), 20);
    const notes = cleanText(form.get("notes"), 2000);
    const file = form.get("file");

    if (!/^[a-z0-9-]+$/.test(companyId)) {
      return Response.json({ error: "Invalid company id." }, { status: 400 });
    }
    if (!versionLabel || !sourceTitle || !(file instanceof File)) {
      return Response.json(
        { error: "Version label, source title, and image are required." },
        { status: 400 },
      );
    }
    if (!validHttpUrl(sourceUrl)) {
      return Response.json(
        { error: "Source URL must start with http:// or https://." },
        { status: 400 },
      );
    }
    const extension = allowedTypes.get(file.type);
    if (!extension) {
      return Response.json(
        { error: "Upload a PNG, JPEG, or WebP image." },
        { status: 400 },
      );
    }
    if (file.size === 0 || file.size > 15 * 1024 * 1024) {
      return Response.json(
        { error: "The original diagram must be between 1 byte and 15 MB." },
        { status: 400 },
      );
    }

    const id = `structure-${crypto.randomUUID()}`;
    const key = `structures/${companyId}/${id}.${extension}`;
    const createdAt = Date.now();
    const bucket = await getStructureAssets();
    await bucket.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: "private, max-age=3600",
      },
      customMetadata: {
        companyId,
        versionId: id,
        originalFilename: file.name.slice(0, 220),
      },
    });

    try {
      const d1 = await getD1();
      await d1
        .prepare(
          `INSERT INTO structure_versions
            (id, company_id, version_label, source_title, source_url, article_date,
             original_image_key, original_filename, original_mime_type, status,
             evidence, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Original captured', 'C', ?, ?)`,
        )
        .bind(
          id,
          companyId,
          versionLabel,
          sourceTitle,
          sourceUrl || null,
          articleDate || null,
          key,
          file.name.slice(0, 220),
          file.type,
          notes || null,
          createdAt,
        )
        .run();
    } catch (error) {
      await bucket.delete(key);
      throw error;
    }

    return Response.json(
      {
        version: {
          id,
          companyId,
          versionLabel,
          sourceTitle,
          sourceUrl: sourceUrl || null,
          articleDate: articleDate || null,
          originalFilename: file.name.slice(0, 220),
          originalMimeType: file.type,
          status: "Original captured",
          evidence: "C",
          notes: notes || null,
          createdAt: new Date(createdAt).toISOString(),
          verifiedAt: null,
          nodeCount: 0,
          edgeCount: 0,
          imageUrl: `/api/structure-assets?key=${encodeURIComponent(key)}`,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return assetError(error);
  }
}
