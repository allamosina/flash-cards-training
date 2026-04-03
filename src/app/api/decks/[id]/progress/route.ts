import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId, status } = await req.json();

  if (!["KNOWN", "HARD", "NOT_SURE"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { id: deckId } = await params;

  // Verify card belongs to this deck
  const card = await prisma.card.findFirst({ where: { id: cardId, deckId } });
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  await prisma.cardProgress.upsert({
    where: { userId_cardId: { userId: session.user.id, cardId } },
    update: { status },
    create: { userId: session.user.id, cardId, status },
  });

  return NextResponse.json({ ok: true });
}
