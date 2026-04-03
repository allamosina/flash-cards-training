"use client";

import { useState } from "react";

interface Props {
  question: string;
  answer: string;
  index: number;
  total: number;
  onMark: (status: "KNOWN" | "HARD" | "NOT_SURE") => void;
  onBack?: () => void;
}

export default function FlashCard({ question, answer, index, total, onMark, onBack }: Props) {
  const [flipped, setFlipped] = useState(false);

  function handleMark(status: "KNOWN" | "HARD" | "NOT_SURE") {
    setFlipped(false);
    onMark(status);
  }

  function handleBack() {
    setFlipped(false);
    onBack?.();
  }

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
        <p className="text-sm text-gray-400">Card {index + 1} of {total}</p>
        <div className="w-12" />
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
          style={{ width: `${((index) / total) * 100}%` }}
        />
      </div>

      {/* Card */}
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
          {/* Front */}
          <div
            className="absolute inset-0 bg-white rounded-2xl shadow-md flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-xs text-gray-400 uppercase tracking-widest mb-3">Question</span>
            <p className="text-xl font-semibold text-gray-800">{question}</p>
            <p className="text-xs text-gray-400 mt-6">Click to reveal answer</p>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 bg-indigo-50 rounded-2xl shadow-md flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span className="text-xs text-indigo-400 uppercase tracking-widest mb-3">Answer</span>
            <p className="text-xl font-semibold text-indigo-800">{answer}</p>
          </div>
        </div>
      </div>

      {/* Action buttons — only show after flip */}
      {flipped ? (
        <div className="flex gap-3 w-full">
          <button
            onClick={() => handleMark("HARD")}
            className="flex-1 bg-red-100 text-red-700 rounded-xl py-3 font-semibold hover:bg-red-200 transition"
          >
            Hard
          </button>
          <button
            onClick={() => handleMark("NOT_SURE")}
            className="flex-1 bg-amber-100 text-amber-700 rounded-xl py-3 font-semibold hover:bg-amber-200 transition"
          >
            Not Sure
          </button>
          <button
            onClick={() => handleMark("KNOWN")}
            className="flex-1 bg-green-100 text-green-700 rounded-xl py-3 font-semibold hover:bg-green-200 transition"
          >
            Known
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-400">Flip the card to mark your answer</p>
      )}
    </div>
  );
}
