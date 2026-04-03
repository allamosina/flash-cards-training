import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deck = await prisma.deck.findFirst({
    where: { id, userId: session.user.id },
    include: {
      cards: {
        include: { progress: { where: { userId: session.user.id } } },
      },
    },
  });

  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(deck);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deck = await prisma.deck.findFirst({ where: { id, userId: session.user.id } });
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.deck.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
