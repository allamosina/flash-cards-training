"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const WORD_TYPES = ["noun", "verb", "phrase", "adjective", "adverb"] as const;
const GENDERS = ["n/a", "masculine", "feminine", "neuter"] as const;

const CSV_EXAMPLE = `czech,russian,gender,type,topic
pes,собака,masculine,noun,animals
jít,идти,,verb,movement
ahoj|nazdar,привет|салют,,phrase,greetings`;

export default function NewWordsPage() {
  const router = useRouter();
  const [singleError, setSingleError] = useState("");
  const [singleSuccess, setSingleSuccess] = useState("");
  const [csvError, setCsvError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopyFormat() {
    await navigator.clipboard.writeText(CSV_EXAMPLE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const [form, setForm] = useState({
    czech: "",
    russian: "",
    gender: "n/a",
    wordType: "noun",
    topic: "",
  });

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSingleError("");
    setSingleSuccess("");
    setLoading(true);

    const res = await fetch("/api/words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        czech: form.czech,
        russian: form.russian,
        gender: form.gender === "n/a" ? null : form.gender,
        wordType: form.wordType,
        topic: form.topic || null,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setSingleError(data.error ?? "Failed to add word");
    } else {
      setSingleSuccess("Word added!");
      setForm({ czech: "", russian: "", gender: "n/a", wordType: "noun", topic: "" });
    }
  }

  async function handleCSVSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCsvError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/words", { method: "POST", body: formData });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setCsvError(data.error ?? "Failed to import CSV");
    } else {
      const { count } = await res.json();
      router.push(`/words?imported=${count}`);
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const selectClass = inputClass;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href="/words" className="text-sm text-indigo-600 hover:underline mb-6 block">
        ← Back to Words
      </Link>

      <div className="space-y-6">
        {/* Single word */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-5">Add a word</h2>
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Czech</label>
                <input
                  type="text"
                  required
                  value={form.czech}
                  onChange={(e) => setField("czech", e.target.value)}
                  placeholder="pes|psi"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Russian</label>
                <input
                  type="text"
                  required
                  value={form.russian}
                  onChange={(e) => setField("russian", e.target.value)}
                  placeholder="собака|псы"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.wordType} onChange={(e) => setField("wordType", e.target.value)} className={selectClass}>
                  {WORD_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select value={form.gender} onChange={(e) => setField("gender", e.target.value)} className={selectClass}>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g === "n/a" ? "N/A" : g.charAt(0).toUpperCase() + g.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.topic}
                onChange={(e) => setField("topic", e.target.value)}
                placeholder="e.g. animals, food, travel"
                className={inputClass}
              />
            </div>
            {singleError && <p className="text-red-500 text-sm">{singleError}</p>}
            {singleSuccess && <p className="text-green-600 text-sm">{singleSuccess}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading ? "Adding…" : "Add Word"}
            </button>
          </form>
        </div>

        {/* CSV import */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-800">Import CSV</h2>
            <div className="relative">
              <button
                onClick={() => setShowTooltip((v) => !v)}
                className="text-sm text-gray-400 hover:text-gray-600 underline decoration-dotted transition"
              >
                Format?
              </button>
              {showTooltip && (
                <div className="absolute right-0 top-6 z-10 w-80 bg-gray-900 text-gray-100 rounded-xl p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold">CSV columns (header row required):</p>
                    <button
                      onClick={handleCopyFormat}
                      className="text-xs px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 transition text-gray-300"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-xs text-gray-300 leading-relaxed">{CSV_EXAMPLE}</pre>
                  <div className="mt-3 space-y-1 text-xs text-gray-400">
                    <p>Use <code className="text-gray-300">|</code> for multiple meanings: <code className="text-gray-300">pes|psi</code></p>
                    <p>Gender: masculine · feminine · neuter · n/a (or empty)</p>
                    <p>Type: noun · verb · phrase · adjective · adverb</p>
                    <p>Topic is optional</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <form onSubmit={handleCSVSubmit} className="space-y-4">
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
            {csvError && <p className="text-red-500 text-sm">{csvError}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading ? "Importing…" : "Import Words"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
