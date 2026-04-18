"use client";

import { useState } from "react";
import Link from "next/link";
import WordFlashCard, { type WordLevel } from "./WordFlashCard";
import { shuffle } from "@/lib/shuffle";

interface Word {
  id: string;
  czech: string;
  russian: string;
  gender: string | null;
  wordType: string;
  topic: string | null;
}

interface Props {
  words: Word[];
  direction: "cz-ru" | "ru-cz";
}

type Summary = Record<WordLevel, number>;

export default function WordStudySession({ words: initialWords, direction }: Props) {
  const [words] = useState(() => shuffle(initialWords));
  const [index, setIndex] = useState(0);
  const [counts, setCounts] = useState<Summary>({ fail: 0, hard: 0, easy: 0, know: 0 });
  const [history, setHistory] = useState<WordLevel[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  async function handleMark(level: WordLevel) {
    const word = words[index];
    await fetch("/api/words/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: word.id, level }),
    });

    const next = { ...counts, [level]: counts[level] + 1 };
    setHistory((h) => [...h, level]);

    if (index + 1 >= words.length) {
      setSummary(next);
    } else {
      setCounts(next);
      setIndex((i) => i + 1);
    }
  }

  function handleBack() {
    if (index === 0) return;
    const prev = history[history.length - 1];
    const next = { ...counts, [prev]: counts[prev] - 1 };
    setHistory((h) => h.slice(0, -1));
    setCounts(next);
    setIndex((i) => i - 1);
  }

  if (words.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-600 mb-2">No words match your filters</p>
        <Link href="/words" className="text-indigo-600 hover:underline">
          Back to Words
        </Link>
      </div>
    );
  }

  if (summary) {
    return (
      <div className="text-center py-12 max-w-sm mx-auto">
        <p className="text-2xl font-bold text-gray-800 mb-2">Session complete</p>
        <p className="text-gray-500 mb-8">Here&apos;s how you did:</p>
        <div className="grid grid-cols-4 gap-3 mb-8">
          <div className="bg-red-50 rounded-xl p-3">
            <p className="text-xl font-bold text-red-700">{summary.fail}</p>
            <p className="text-xs text-red-500 mt-1">Fail</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-xl font-bold text-amber-700">{summary.hard}</p>
            <p className="text-xs text-amber-500 mt-1">Hard</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xl font-bold text-blue-700">{summary.easy}</p>
            <p className="text-xs text-blue-500 mt-1">Easy</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xl font-bold text-green-700">{summary.know}</p>
            <p className="text-xs text-green-500 mt-1">Know</p>
          </div>
        </div>
        <Link
          href="/words"
          className="block w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 transition"
        >
          Back to Words
        </Link>
      </div>
    );
  }

  const word = words[index];
  return (
    <WordFlashCard
      question={direction === "cz-ru" ? word.czech : word.russian}
      answer={direction === "cz-ru" ? word.russian : word.czech}
      meta={{ gender: word.gender, wordType: word.wordType, topic: word.topic }}
      direction={direction}
      index={index}
      total={words.length}
      onMark={handleMark}
      onBack={index > 0 ? handleBack : undefined}
    />
  );
}
