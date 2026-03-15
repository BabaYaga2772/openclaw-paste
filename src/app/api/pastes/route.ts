import { put, head, del } from "@vercel/blob";
import { NextResponse } from "next/server";

export interface Paste {
  id: string;
  content: string;
  createdAt: number;
  label?: string;
}

const BLOB_PATH = "pastes.json";
const MAX_PASTES = 50;

async function readPastes(): Promise<Paste[]> {
  try {
    const blob = await head(BLOB_PATH);
    const res = await fetch(blob.url);
    return await res.json();
  } catch {
    return [];
  }
}

async function writePastes(pastes: Paste[]) {
  // Delete old blob first if it exists
  try {
    const blob = await head(BLOB_PATH);
    await del(blob.url);
  } catch {
    // doesn't exist yet, that's fine
  }

  await put(BLOB_PATH, JSON.stringify(pastes), {
    access: "public",
    addRandomSuffix: false,
  });
}

export async function GET() {
  try {
    const pastes = await readPastes();
    return NextResponse.json(pastes);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const { content, label } = await req.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    const paste: Paste = {
      id: crypto.randomUUID(),
      content,
      label: label || undefined,
      createdAt: Date.now(),
    };

    const pastes = await readPastes();
    pastes.unshift(paste);
    await writePastes(pastes.slice(0, MAX_PASTES));

    return NextResponse.json(paste, { status: 201 });
  } catch (err) {
    console.error("Failed to save paste:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const pastes = await readPastes();
    const filtered = pastes.filter((p) => p.id !== id);
    await writePastes(filtered);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete paste:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
