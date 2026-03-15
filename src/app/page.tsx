"use client";

import { useState, useEffect, useCallback } from "react";

interface Paste {
  id: string;
  content: string;
  createdAt: number;
  label?: string;
}

export default function Home() {
  const [pastes, setPastes] = useState<Paste[]>([]);
  const [content, setContent] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadPastes = useCallback(async () => {
    try {
      const res = await fetch("/api/pastes");
      const data = await res.json();
      setPastes(data);
    } catch {
      // silently fail on load
    }
  }, []);

  useEffect(() => {
    loadPastes();
  }, [loadPastes]);

  const savePaste = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/pastes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, label: label.trim() }),
      });
      setContent("");
      setLabel("");
      await loadPastes();
    } catch {
      alert("Failed to save paste");
    } finally {
      setSaving(false);
    }
  };

  const deletePaste = async (id: string) => {
    try {
      await fetch("/api/pastes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await loadPastes();
    } catch {
      // fail silently
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      savePaste();
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-xl font-bold" style={{ color: "#D4AF37" }}>
          OpenClaw Paste
        </h1>
        <span className="text-xs text-neutral-500">
          paste &middot; save &middot; grab from anywhere
        </span>
      </div>

      {/* Input area */}
      <div className="rounded-lg p-4 mb-6 bg-[#1a1a1a] border border-[#2a2a2a]">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="px-3 py-1.5 rounded text-sm flex-1 max-w-xs outline-none bg-[#0d0d0d] border border-[#2a2a2a] text-neutral-200 focus:border-[#D4AF37]"
          />
        </div>
        <textarea
          placeholder="Paste code or text here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={8}
          className="w-full rounded p-3 text-sm font-mono resize-y outline-none bg-[#0d0d0d] border border-[#2a2a2a] text-neutral-200 focus:border-[#D4AF37]"
          style={{ minHeight: "120px" }}
          spellCheck={false}
        />
        <div className="flex justify-between items-center mt-3">
          <span className="text-xs text-neutral-500">
            {"\u2318"}+Enter to save
          </span>
          <button
            onClick={savePaste}
            disabled={saving || !content.trim()}
            className="px-4 py-2 rounded text-sm font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-[#D4AF37] text-[#0d0d0d] hover:bg-[#e0c04a] transition-colors"
          >
            {saving ? "Saving..." : "Save Paste"}
          </button>
        </div>
      </div>

      {/* Pastes list */}
      <div className="space-y-3">
        {pastes.length === 0 && (
          <p className="text-center py-8 text-sm text-neutral-500">
            No pastes yet. Paste something above.
          </p>
        )}
        {pastes.map((paste) => (
          <div
            key={paste.id}
            className="rounded-lg overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a]"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-3">
                {paste.label && (
                  <span className="text-sm font-bold text-[#D4AF37]">
                    {paste.label}
                  </span>
                )}
                <span className="text-xs text-neutral-500">
                  {timeAgo(paste.createdAt)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(paste.content, paste.id)}
                  className="px-3 py-1 rounded text-xs cursor-pointer transition-colors border"
                  style={{
                    background: copiedId === paste.id ? "#2d5a2d" : "#0d0d0d",
                    borderColor: copiedId === paste.id ? "#4a8a4a" : "#2a2a2a",
                    color: copiedId === paste.id ? "#6fdc6f" : "#e0e0e0",
                  }}
                >
                  {copiedId === paste.id ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={() => deletePaste(paste.id)}
                  className="px-3 py-1 rounded text-xs cursor-pointer transition-colors bg-[#0d0d0d] border border-[#2a2a2a] text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
            <pre className="p-4 text-sm overflow-x-auto whitespace-pre-wrap break-words text-neutral-200">
              {paste.content}
            </pre>
          </div>
        ))}
      </div>
    </main>
  );
}
