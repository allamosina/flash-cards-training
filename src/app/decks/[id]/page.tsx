import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteDeckButton from "@/components/DeleteDeckButton";

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const deck = await prisma.deck.findFirst({
    where: { id, userId: session.user.id },
    include: {
      cards: {
        include: { progress: { where: { userId: session.user.id } } },
        orderBy: { question: "asc" },
      },
    },
  });

  if (!deck) notFound();

  const total = deck.cards.length;
  const known = deck.cards.filter((c) => c.progress[0]?.status === "KNOWN").length;
  const hard = deck.cards.filter((c) => c.progress[0]?.status === "HARD").length;
  const notSure = deck.cards.filter((c) => c.progress[0]?.status === "NOT_SURE").length;
  const unseen = deck.cards.filter((c) => !c.progress[0]).length;

  const statusLabel: Record<string, { label: string; className: string }> = {
    KNOWN: { label: "Known", className: "bg-green-100 text-green-700" },
    HARD: { label: "Hard", className: "bg-red-100 text-red-700" },
    NOT_SURE: { label: "Not Sure", className: "bg-amber-100 text-amber-700" },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline mb-6 block">
        ← Back to dashboard
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{deck.name}</h1>
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <span>{total} total</span>
            <span className="text-green-600 font-medium">{known} known</span>
            <span className="text-red-500 font-medium">{hard} hard</span>
            <span className="text-amber-600 font-medium">{notSure} not sure</span>
            <span>{unseen} unseen</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/decks/${id}/study`}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
          >
            Study
          </Link>
          <DeleteDeckButton deckId={id} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="text-left px-4 py-3 w-1/2">Question</th>
              <th className="text-left px-4 py-3 w-1/2">Answer</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {deck.cards.map((card) => {
              const status = card.progress[0]?.status;
              const s = status ? statusLabel[status] : null;
              return (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{card.question}</td>
                  <td className="px-4 py-3 text-gray-600">{card.answer}</td>
                  <td className="px-4 py-3">
                    {s ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.className}`}>
                        {s.label}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Unseen</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
