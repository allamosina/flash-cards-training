"use client";

import { useState } from "react";

export type WordLevel = "fail" | "hard" | "easy" | "know";

interface Props {
  question: string;
  answer: string;
  meta: { gender: string | null; wordType: string; topic: string | null };
  direction: "cz-ru" | "ru-cz";
  index: number;
  total: number;
  onMark: (level: WordLevel) => void;
  onBack?: () => void;
}

function formatMeanings(text: string) {
  return text.split("|").join(" · ");
}

export default function WordFlashCard({ question, answer, meta, direction, index, total, onMark, onBack }: Props) {
  const [flipped, setFlipped] = useState(false);

  function handleMark(level: WordLevel) {
    setFlipped(false);
    onMark(level);
  }

  function handleBack() {
    setFlipped(false);
    onBack?.();
  }

  const questionLabel = direction === "cz-ru" ? "Czech" : "Russian";
  const answerLabel = direction === "cz-ru" ? "Russian" : "Czech";

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto">
      <div className="flex items-center justify-between w-full">
        <button
          onClick={handleBack}
          disabled={!onBack}
          className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-0 transition flex items-center gap-1"
        >
          ← Back
        </button>
        <p className="text-sm text-gray-400">Word {index + 1} of {total}</p>
        <div className="w-12" />
      </div>

      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>

      <div
        onClick={() => setFlipped((f) => !f)}
        className="w-full cursor-pointer select-none"
        style={{ perspective: "1000px" }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "240px",
          }}
        >
          <div
            className="absolute inset-0 bg-white rounded-2xl shadow-md flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-xs text-gray-400 uppercase tracking-widest mb-3">{questionLabel}</span>
            <p className="text-2xl font-semibold text-gray-800">{formatMeanings(question)}</p>
            <p className="text-xs text-gray-400 mt-6">Click to reveal</p>
          </div>

          <div
            className="absolute inset-0 bg-indigo-50 rounded-2xl shadow-md flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span className="text-xs text-indigo-400 uppercase tracking-widest mb-3">{answerLabel}</span>
            <p className="text-2xl font-semibold text-indigo-800">{formatMeanings(answer)}</p>
            <div className="flex gap-2 mt-4 flex-wrap justify-center">
              <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full capitalize">{meta.wordType}</span>
              {meta.gender && meta.gender !== "n/a" && (
                <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full capitalize">{meta.gender}</span>
              )}
              {meta.topic && (
                <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-600 rounded-full">{meta.topic}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="flex gap-3 w-full">
          <button
            onClick={() => handleMark("fail")}
            className="flex-1 bg-red-100 text-red-700 rounded-xl py-3 font-semibold hover:bg-red-200 transition"
          >
            Fail
          </button>
          <button
            onClick={() => handleMark("hard")}
            className="flex-1 bg-amber-100 text-amber-700 rounded-xl py-3 font-semibold hover:bg-amber-200 transition"
          >
            Hard
          </button>
          <button
            onClick={() => handleMark("easy")}
            className="flex-1 bg-blue-100 text-blue-700 rounded-xl py-3 font-semibold hover:bg-blue-200 transition"
          >
            Easy
          </button>
          <button
            onClick={() => handleMark("know")}
            className="flex-1 bg-green-100 text-green-700 rounded-xl py-3 font-semibold hover:bg-green-200 transition"
          >
            Know
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-400">Flip the card to mark your answer</p>
      )}
    </div>
  );
}
