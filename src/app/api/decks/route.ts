import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV } from "@/lib/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decks = await prisma.deck.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { cards: true } },
      cards: {
        include: {
          progress: { where: { userId: session.user.id } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = decks.map((deck) => {
    const total = deck._count.cards;
    const known = deck.cards.filter((c) => c.progress[0]?.status === "KNOWN").length;
    return { id: deck.id, name: deck.name, total, known, remaining: total - known };
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const name = formData.get("name") as string;
  const file = formData.get("csv") as File;

  if (!name || !file) {
    return NextResponse.json({ error: "Name and CSV required" }, { status: 400 });
  }

  const content = await file.text();
  let cards: { question: string; answer: string }[];
  try {
    cards = parseCSV(content);
  } catch {
    return NextResponse.json({ error: "Invalid CSV format" }, { status: 400 });
  }

  if (cards.length === 0) {
    return NextResponse.json({ error: "CSV has no valid rows" }, { status: 400 });
  }

  let deck;
  try {
    deck = await prisma.deck.create({
      data: {
        name,
        userId: session.user.id,
        cards: { create: cards },
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create deck. Your session may be invalid — try signing out and back in." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: deck.id });
}
