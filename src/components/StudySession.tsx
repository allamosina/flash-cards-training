"use client";

import { useState } from "react";
import FlashCard from "./FlashCard";
import Link from "next/link";

interface Card {
  id: string;
  question: string;
  answer: string;
}

interface Props {
  deckId: string;
  deckName: string;
  cards: Card[];
}

type Summary = { known: number; hard: number; notSure: number };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ResetButton({ deckId }: { deckId: string }) {
  async function handleReset() {
    await fetch(`/api/decks/${deckId}/reset`, { method: "POST" });
    window.location.reload();
  }
  return (
    <button
      onClick={handleReset}
      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
    >
      Reset Progress
    </button>
  );
}

export default function StudySession({ deckId, deckName, cards: initialCards }: Props) {
  const [cards] = useState(() => shuffle(initialCards));
  const [index, setIndex] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [counts, setCounts] = useState({ known: 0, hard: 0, notSure: 0 });

  async function handleMark(status: "KNOWN" | "HARD" | "NOT_SURE") {
    const card = cards[index];

    await fetch(`/api/decks/${deckId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: card.id, status }),
    });

    const next = { ...counts };
    if (status === "KNOWN") next.known++;
    else if (status === "HARD") next.hard++;
    else next.notSure++;

    if (index + 1 >= cards.length) {
      setSummary(next);
    } else {
      setCounts(next);
      setIndex((i) => i + 1);
    }
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-green-600 mb-2">All cards are known!</p>
        <p className="text-gray-500 mb-6">You&apos;ve mastered this deck.</p>
        <div className="flex gap-3 justify-center">
          <Link href={`/decks/${deckId}`} className="border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
            View Deck
          </Link>
          <ResetButton deckId={deckId} />
        </div>
      </div>
    );
  }

  if (summary) {
    const allKnown = summary.hard === 0 && summary.notSure === 0;
    return (
      <div className="text-center py-12 max-w-sm mx-auto">
        {allKnown ? (
          <p className="text-2xl font-bold text-green-600 mb-2">All cards known!</p>
        ) : (
          <p className="text-2xl font-bold text-gray-800 mb-2">Session complete</p>
        )}
        <p className="text-gray-500 mb-8">Here&apos;s how you did:</p>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-700">{summary.known}</p>
            <p className="text-sm text-green-600 mt-1">Known</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-amber-700">{summary.notSure}</p>
            <p className="text-sm text-amber-600 mt-1">Not Sure</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-red-700">{summary.hard}</p>
            <p className="text-sm text-red-600 mt-1">Hard</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {!allKnown && (
            <button
              onClick={() => { window.location.href = `/decks/${deckId}/study`; }}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 transition"
            >
              Study Again (remaining cards)
            </button>
          )}
          <Link
            href={`/decks/${deckId}`}
            className="w-full border border-gray-200 text-gray-700 rounded-xl py-3 text-sm hover:bg-gray-50 transition"
          >
            Back to Deck
          </Link>
        </div>
      </div>
    );
  }

  return (
    <FlashCard
      question={cards[index].question}
      answer={cards[index].answer}
      index={index}
      total={cards.length}
      onMark={handleMark}
    />
  );
}
