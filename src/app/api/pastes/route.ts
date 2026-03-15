import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export interface Paste {
  id: string;
  content: string;
  createdAt: number;
  label?: string;
}

const PASTES_KEY = "openclaw:pastes";
const MAX_PASTES = 50;

export async function GET() {
  try {
    const pastes = await kv.lrange<Paste>(PASTES_KEY, 0, MAX_PASTES - 1);
    return NextResponse.json(pastes ?? []);
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

    await kv.lpush(PASTES_KEY, paste);
    await kv.ltrim(PASTES_KEY, 0, MAX_PASTES - 1);

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

    const pastes = await kv.lrange<Paste>(PASTES_KEY, 0, -1);
    const filtered = (pastes ?? []).filter((p) => p.id !== id);

    await kv.del(PASTES_KEY);
    if (filtered.length > 0) {
      await kv.rpush(PASTES_KEY, ...filtered);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete paste:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
