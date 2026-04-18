"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TabBar() {
  const pathname = usePathname();
  const isWords = pathname.startsWith("/words");

  return (
    <div className="flex border-b border-gray-200 mb-6">
      <Link
        href="/dashboard"
        className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
          !isWords
            ? "border-indigo-600 text-indigo-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        Decks
      </Link>
      <Link
        href="/words"
        className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
          isWords
            ? "border-indigo-600 text-indigo-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        Words
      </Link>
    </div>
  );
}
