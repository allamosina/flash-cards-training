import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import StudySession from "@/components/StudySession";

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const deck = await prisma.deck.findFirst({
    where: { id, userId: session.user.id },
    include: {
      cards: {
        include: { progress: { where: { userId: session.user.id } } },
      },
    },
  });

  if (!deck) notFound();

  // Only show cards that are NOT marked as KNOWN
  const studyCards = deck.cards
    .filter((c) => c.progress[0]?.status !== "KNOWN")
    .map((c) => ({ id: c.id, question: c.question, answer: c.answer }));

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <Link href={`/decks/${id}`} className="text-sm text-indigo-600 hover:underline">
          ← {deck.name}
        </Link>
        <span className="text-sm text-gray-400">{studyCards.length} cards to study</span>
      </div>
      <StudySession deckId={id} deckName={deck.name} cards={studyCards} />
    </div>
  );
}
