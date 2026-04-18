import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseWordCSV } from "@/lib/parseWordCSV";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const words = await prisma.word.findMany({
    where: { userId: session.user.id },
    include: { progress: { where: { userId: session.user.id } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    words.map((w) => ({
      id: w.id,
      czech: w.czech,
      russian: w.russian,
      gender: w.gender,
      wordType: w.wordType,
      topic: w.topic,
      level: w.progress[0]?.level ?? "new",
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("csv") as File | null;
    if (!file) return NextResponse.json({ error: "CSV file required" }, { status: 400 });

    const content = await file.text();
    let rows;
    try {
      rows = parseWordCSV(content);
    } catch {
      return NextResponse.json({ error: "Invalid CSV format" }, { status: 400 });
    }

    if (rows.length === 0) return NextResponse.json({ error: "No valid rows in CSV" }, { status: 400 });

    await prisma.word.createMany({
      data: rows.map((r) => ({ ...r, userId: session.user.id })),
    });

    return NextResponse.json({ count: rows.length });
  }

  const body = await req.json();
  const { czech, russian, gender, wordType, topic } = body;

  if (!czech || !russian || !wordType) {
    return NextResponse.json({ error: "czech, russian, and wordType are required" }, { status: 400 });
  }

  const word = await prisma.word.create({
    data: {
      czech,
      russian,
      gender: gender || null,
      wordType,
      topic: topic || null,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ id: word.id });
}
