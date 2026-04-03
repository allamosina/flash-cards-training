"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewDeckPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/decks", {
      method: "POST",
      body: form,
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create deck");
    } else {
      const { id } = await res.json();
      router.push(`/decks/${id}`);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline mb-6 block">
        ← Back to dashboard
      </Link>
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">New Deck</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deck name</label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Spanish Vocabulary"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CSV file</label>
            <p className="text-xs text-gray-400 mb-2">
              Columns: <code>question</code>/<code>answer</code> or <code>front</code>/<code>back</code> (header row required)
            </p>
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 transition">
              <div className="text-center">
                {fileName ? (
                  <p className="text-sm text-indigo-600 font-medium">{fileName}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500">Click to upload CSV</p>
                    <p className="text-xs text-gray-400 mt-1">or drag and drop</p>
                  </>
                )}
              </div>
              <input
                name="csv"
                type="file"
                accept=".csv,text/csv"
                required
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              />
            </label>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? "Creating…" : "Create Deck"}
          </button>
        </form>
      </div>
    </div>
  );
}
