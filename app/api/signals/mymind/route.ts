import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface MymindRecord {
  id?: string | number;
  title?: string;
  name?: string;
  text?: string;
  excerpt?: string;
  description?: string;
  type?: string;
  kind?: string;
  createdAt?: string;
  created_at?: string;
  savedAt?: string;
  saved_at?: string;
}

function setupResponse() {
  return NextResponse.json(
    {
      provider: "mymind",
      configured: false,
      officialApiAvailable: false,
      message:
        "mymind does not currently expose an open public API. If you get access to their private alpha API, add the endpoint here and this card will render saved items natively.",
      needs: ["MYMIND_API_URL", "MYMIND_API_TOKEN if the private endpoint requires bearer auth"],
      docs: "https://mymind.helpscoutdocs.com/article/108-api-integrations",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

function normalizeItems(payload: unknown) {
  const records = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload
      ? Array.isArray((payload as { items?: unknown }).items)
        ? (payload as { items: unknown[] }).items
        : Array.isArray((payload as { data?: unknown }).data)
          ? (payload as { data: unknown[] }).data
          : []
      : [];

  return records.slice(0, 6).map((record, index) => {
    const item = record as MymindRecord;
    return {
      id: String(item.id ?? index),
      title: item.title ?? item.name ?? item.text ?? "Saved item",
      kind: item.type ?? item.kind ?? "card",
      excerpt: item.excerpt ?? item.description ?? null,
      savedAt: item.savedAt ?? item.saved_at ?? item.createdAt ?? item.created_at ?? null,
    };
  });
}

export async function GET() {
  const apiUrl = process.env.MYMIND_API_URL;
  if (!apiUrl) return setupResponse();

  try {
    const response = await fetch(apiUrl, {
      headers: process.env.MYMIND_API_TOKEN ? { Authorization: `Bearer ${process.env.MYMIND_API_TOKEN}` } : {},
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`mymind API request failed with ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const items = normalizeItems(payload);

    return NextResponse.json(
      {
        provider: "mymind",
        configured: true,
        generatedAt: new Date().toISOString(),
        itemCount: items.length,
        items,
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        provider: "mymind",
        configured: true,
        message: error instanceof Error ? error.message : "mymind API request failed.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
