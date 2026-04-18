"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Level = "new" | "fail" | "hard" | "easy" | "know";
type Direction = "cz-ru" | "ru-cz";

const WORD_TYPES = ["noun", "verb", "phrase", "adjective", "adverb"] as const;
const ALL_LEVELS: Level[] = ["new", "fail", "hard", "easy", "know"];
const DEFAULT_LEVELS = new Set<Level>(["new", "fail", "hard", "easy"]);

export interface WordData {
  id: string;
  czech: string;
  russian: string;
  gender: string | null;
  wordType: string;
  topic: string | null;
  level: string;
}

const LEVEL_BADGE: Record<string, string> = {
  new: "bg-gray-100 text-gray-600",
  fail: "bg-red-100 text-red-700",
  hard: "bg-amber-100 text-amber-700",
  easy: "bg-blue-100 text-blue-700",
  know: "bg-green-100 text-green-700",
};

const LEVEL_ACTIVE: Record<string, string> = {
  new: "bg-gray-600 text-white",
  fail: "bg-red-600 text-white",
  hard: "bg-amber-500 text-white",
  easy: "bg-blue-600 text-white",
  know: "bg-green-600 text-white",
};

function toggleSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export default function WordsTab({ initialWords }: { initialWords: WordData[] }) {
  const router = useRouter();
  const [direction, setDirection] = useState<Direction>("cz-ru");
  const [selectedLevels, setSelectedLevels] = useState<Set<Level>>(new Set(DEFAULT_LEVELS));
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [words, setWords] = useState(initialWords);

  const topics = useMemo(() => {
    const t = new Set<string>();
    words.forEach((w) => { if (w.topic) t.add(w.topic); });
    return Array.from(t).sort();
  }, [words]);

  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      if (!selectedLevels.has(w.level as Level)) return false;
      if (selectedTypes.size > 0 && !selectedTypes.has(w.wordType)) return false;
      if (selectedTopics.size > 0 && !selectedTopics.has(w.topic ?? "")) return false;
      return true;
    });
  }, [words, selectedLevels, selectedTypes, selectedTopics]);

  function handleStart() {
    const params = new URLSearchParams();
    params.set("direction", direction);
    params.set("levels", Array.from(selectedLevels).join(","));
    if (selectedTypes.size > 0) params.set("types", Array.from(selectedTypes).join(","));
    if (selectedTopics.size > 0) params.set("topics", Array.from(selectedTopics).join(","));
    router.push(`/words/study?${params.toString()}`);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/words/${id}`, { method: "DELETE" });
    setWords((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Link
          href="/words/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          + Add Words
        </Link>
      </div>

      {words.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 space-y-4">
          {/* Direction */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Direction</p>
            <div className="flex gap-2">
              {(["cz-ru", "ru-cz"] as Direction[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    direction === d ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {d === "cz-ru" ? "CZ → RU" : "RU → CZ"}
                </button>
              ))}
            </div>
          </div>

          {/* Level filter */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Level</p>
            <div className="flex flex-wrap gap-2">
              {ALL_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevels((prev) => toggleSet(prev, level))}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    selectedLevels.has(level)
                      ? LEVEL_ACTIVE[level]
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Type filter */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Type <span className="text-gray-400 font-normal normal-case">(none = all)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {WORD_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedTypes((prev) => toggleSet(prev, type))}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    selectedTypes.has(type)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Topic filter */}
          {topics.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Topic <span className="text-gray-400 font-normal normal-case">(none = all)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopics((prev) => toggleSet(prev, topic))}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      selectedTopics.has(topic)
                        ? "bg-violet-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={filteredWords.length === 0}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Start Study ({filteredWords.length} words)
          </button>
        </div>
      )}

      {/* Words list */}
      {words.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-4">No words yet</p>
          <Link href="/words/new" className="text-indigo-600 hover:underline">
            Add your first words
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Czech</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Russian</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Gender</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Topic</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Level</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {words.map((word) => (
                <tr key={word.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{word.czech.split("|").join(" · ")}</td>
                  <td className="px-4 py-3 text-gray-600">{word.russian.split("|").join(" · ")}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{word.wordType}</td>
                  <td className="px-4 py-3 text-gray-500">{word.gender ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{word.topic ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${LEVEL_BADGE[word.level] ?? LEVEL_BADGE.new}`}>
                      {word.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(word.id)}
                      className="text-red-400 hover:text-red-600 text-xs transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
