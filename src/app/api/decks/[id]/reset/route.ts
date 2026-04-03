import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: deckId } = await params;

  const deck = await prisma.deck.findFirst({ where: { id: deckId, userId: session.user.id } });
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete all progress for cards in this deck for this user
  await prisma.cardProgress.deleteMany({
    where: {
      userId: session.user.id,
      card: { deckId },
    },
  });

  return NextResponse.json({ ok: true });
}
