import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const decks = await prisma.deck.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { cards: true } },
      cards: {
        include: { progress: { where: { userId: session.user.id } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const deckStats = decks.map((deck) => {
    const total = deck._count.cards;
    const known = deck.cards.filter((c) => c.progress[0]?.status === "KNOWN").length;
    return { id: deck.id, name: deck.name, total, known, remaining: total - known };
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">My Decks</h1>
        <div className="flex gap-3 items-center">
          <span className="text-sm text-gray-500">Hi, {session.user.name}</span>
          <SignOutButton />
          <Link
            href="/decks/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
          >
            + New Deck
          </Link>
        </div>
      </header>

      {deckStats.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-4">No decks yet</p>
          <Link href="/decks/new" className="text-indigo-600 hover:underline">
            Create your first deck
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {deckStats.map((deck) => (
            <div key={deck.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
              <div>
                <Link href={`/decks/${deck.id}`} className="text-lg font-semibold text-gray-800 hover:text-indigo-600 transition">{deck.name}</Link>
                <div className="flex gap-3 mt-1 text-sm text-gray-500">
                  <span>{deck.total} cards</span>
                  <span className="text-green-600 font-medium">{deck.known} known</span>
                  <span className="text-amber-600 font-medium">{deck.remaining} remaining</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/decks/${deck.id}`}
                  className="border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  View
                </Link>
                <Link
                  href={`/decks/${deck.id}/study`}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                >
                  Study
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
