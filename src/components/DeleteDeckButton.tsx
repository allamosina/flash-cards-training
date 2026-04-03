"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteDeckButton({ deckId }: { deckId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this deck and all its cards? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm hover:bg-red-50 transition disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
