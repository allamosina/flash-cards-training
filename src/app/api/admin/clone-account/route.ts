import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { sourceEmail, targetEmail, targetName, targetPassword } = await req.json();

  const source = await prisma.user.findUnique({
    where: { email: sourceEmail },
    include: {
      decks: { include: { cards: true } },
      words: true,
    },
  });

  if (!source) return NextResponse.json({ error: "Source user not found" }, { status: 404 });

  const existing = await prisma.user.findUnique({ where: { email: targetEmail } });
  if (existing) return NextResponse.json({ error: "Target user already exists" }, { status: 409 });

  const hashedPassword = await bcrypt.hash(targetPassword, 10);

  const newUser = await prisma.user.create({
    data: {
      email: targetEmail,
      name: targetName,
      password: hashedPassword,
      decks: {
        create: source.decks.map((deck) => ({
          name: deck.name,
          createdAt: deck.createdAt,
          cards: { create: deck.cards.map((c) => ({ question: c.question, answer: c.answer })) },
        })),
      },
      words: {
        create: source.words.map((w) => ({
          czech: w.czech,
          russian: w.russian,
          gender: w.gender,
          wordType: w.wordType,
          topic: w.topic,
          createdAt: w.createdAt,
        })),
      },
    },
  });

  return NextResponse.json({ ok: true, userId: newUser.id, decks: source.decks.length, words: source.words.length });
}
