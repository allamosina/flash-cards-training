import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_LEVELS = new Set(["new", "fail", "hard", "easy", "know"]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { wordId, level } = await req.json();
  if (!wordId || !VALID_LEVELS.has(level)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const word = await prisma.word.findFirst({ where: { id: wordId, userId: session.user.id } });
  if (!word) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.wordProgress.upsert({
    where: { userId_wordId: { userId: session.user.id, wordId } },
    create: { userId: session.user.id, wordId, level },
    update: { level },
  });

  return NextResponse.json({ ok: true });
}
